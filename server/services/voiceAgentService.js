'use strict';

const Groq         = require('groq-sdk');
const Appointment  = require('../models/Appointment');
const Conversation = require('../models/Conversation');
const Doctor       = require('../models/doctor');
const emailService = require('./emailService');

/* ================================================================
   EMAIL HELPERS
================================================================ */
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((str || '').trim());
}

function normalizeSpokenEmail(transcript) {
  if (!transcript) return transcript;
  const lower = transcript.toLowerCase().trim();
  if (!((lower.includes(' at ') || lower.includes('@')) &&
        (lower.includes(' dot ') || lower.includes('.')))) return transcript;
  const SYMBOL_MAP = {
    'at': '@', 'at the rate': '@', 'at sign': '@',
    'dot': '.', 'point': '.', 'period': '.',
    'underscore': '_', 'under score': '_',
    'hyphen': '-', 'dash': '-', 'minus': '-',
    'zero': '0', 'oh': '0',
    'one': '1', 'two': '2', 'to': '2', 'too': '2',
    'three': '3', 'four': '4', 'for': '4',
    'five': '5', 'six': '6', 'seven': '7',
    'eight': '8', 'ate': '8', 'nine': '9',
  };
  const stripped = lower.replace(/^(my\s+)?(email\s+)?(address\s+)?(is\s+)?/i, '').trim();
  const tokens   = stripped.split(/[\s,]+/).filter(Boolean);
  let result = ''; let i = 0;
  while (i < tokens.length) {
    const token   = tokens[i].toLowerCase();
    const twoWord = i + 1 < tokens.length ? `${token} ${tokens[i+1].toLowerCase()}` : null;
    if (twoWord && SYMBOL_MAP[twoWord] !== undefined) { result += SYMBOL_MAP[twoWord]; i += 2; continue; }
    if (SYMBOL_MAP[token] !== undefined)              { result += SYMBOL_MAP[token];   i++;     continue; }
    if (/^\d+$/.test(token))                          { result += token;               i++;     continue; }
    result += token; i++;
  }
  const atCount = (result.match(/@/g) || []).length;
  const hasDot  = result.includes('.') && result.indexOf('.') > result.indexOf('@');
  if (atCount !== 1 || !hasDot || result.length < 6) return transcript;
  return result;
}

function cleanEmail(raw) {
  if (!raw) return '';
  let email = normalizeSpokenEmail(raw.toLowerCase().trim());
  email = email.replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.').replace(/\s+/g, '');
  return email;
}

/* ================================================================
   VOICE AGENT SERVICE  (Groq · openai/gpt-oss-20b)
   Install : npm install groq-sdk
   API key : https://console.groq.com/keys
================================================================ */
class VoiceAgentService {
  constructor() {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY missing from .env  ->  https://console.groq.com/keys');
    this.client         = new Groq({ apiKey: key });
    this.modelNames     = ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    this.modelCooldowns = {};

    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_doctors',
          description: 'Get list of all available doctors with their specialization, address and clinic location.',
          parameters: {
            type: 'object',
            properties: {
              specialization: { type: 'string', description: 'Optional filter by specialization — omit entirely if not specified' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'find_nearby_doctors',
          description: 'Find doctors near a given location (lat/lng) within a radius. Use when patient asks for doctors near them or near a city.',
          parameters: {
            type: 'object',
            properties: {
              lat:            { type: 'number', description: 'Latitude of patient or place' },
              lng:            { type: 'number', description: 'Longitude of patient or place' },
              radiusKm:       { type: 'number', description: 'Search radius in kilometres, default 10' },
              specialization: { type: 'string', description: 'Optional specialization filter — omit if not specified' },
              locationName:   { type: 'string', description: 'Human-readable place name e.g. "Mysuru"' },
            },
            required: ['lat', 'lng']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_availability',
          description: 'Check available appointment slots for a specific date.',
          parameters: {
            type: 'object',
            properties: {
              date:     { type: 'string', description: 'Date (YYYY-MM-DD)' },
              doctorId: { type: 'string', description: 'Optional MongoDB ObjectId of doctor' }
            },
            required: ['date']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Book a dental appointment for the patient.',
          parameters: {
            type: 'object',
            properties: {
              patientName:  { type: 'string' },
              patientPhone: { type: 'string' },
              patientEmail: { type: 'string' },
              date:         { type: 'string', description: 'YYYY-MM-DD' },
              time:         { type: 'string', description: 'HH:MM 24h' },
              service: {
                type: 'string',
                enum: ['General Checkup','Teeth Cleaning','Root Canal','Dental Crowns','Teeth Whitening','Emergency']
              },
              doctorId:   { type: 'string', description: 'MongoDB ObjectId of doctor (preferred)' },
              doctorName: { type: 'string', description: 'Doctor name fallback if no doctorId' },
              notes:      { type: 'string' }
            },
            required: ['patientName','patientPhone','patientEmail','date','time','service']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'cancel_appointment',
          description: 'Cancel the most recent upcoming appointment for the patient. Look up by patientEmail + date or use appointmentId if known.',
          parameters: {
            type: 'object',
            properties: {
              appointmentId: { type: 'string', description: 'MongoDB ObjectId — only if you actually have it' },
              patientEmail:  { type: 'string', description: 'Patient email to look up their appointment' },
              date:          { type: 'string', description: 'YYYY-MM-DD — helps narrow down which appointment' },
              reason:        { type: 'string' }
            },
            required: []
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_clinic_info',
          description: 'Get clinic information like address, phone, hours.',
          parameters: {
            type: 'object',
            properties: {
              infoType: { type: 'string', enum: ['address','phone','hours','emergency','all'] }
            },
            required: ['infoType']
          }
        }
      }
    ];
  }

  buildSystemPrompt(patientContext = null) {
    const base = `You are Sarah, a friendly and professional dental clinic receptionist at SmileCare Dental.

Your role:
1. Greet patients warmly and help them feel comfortable
2. Help schedule, reschedule, or cancel appointments
3. Tell patients about available doctors — always use get_doctors or find_nearby_doctors
4. When patient asks for doctors near them or near a location, ALWAYS call find_nearby_doctors
5. When giving a doctor's address, read out the full address clearly
6. Be empathetic and concise — keep responses under 60 words when possible

Clinic: SmileCare Dental | Mon-Fri 9am-6pm | Sat 10am-4pm | Emergency: +1 (555) 911-0123

CRITICAL TOOL RULES — NEVER VIOLATE:
- NEVER output raw <function=...> or JSON blobs in your text. Call tools silently.
- NEVER pass null or empty string "" for any parameter. Omit optional params entirely.
- NEVER invent an appointmentId. If cancelling and you don't have the real ObjectId, pass patientEmail instead.
- For specialization: only include if patient explicitly asked for a specific type.
- Always wait for tool results before responding.`;

    if (patientContext?.name || patientContext?.email) {
      const known = [];
      if (patientContext.name)  known.push(`Full name: ${patientContext.name}`);
      if (patientContext.email) known.push(`Email: ${patientContext.email}`);
      if (patientContext.phone) known.push(`Phone: ${patientContext.phone}`);
      if (patientContext.lat && patientContext.lng) {
        known.push(`Location: lat ${patientContext.lat}, lng ${patientContext.lng}`);
      }

      return `${base}

PATIENT ON FILE — use these details directly, do not ask for them:
${known.map(k => `  • ${k}`).join('\n')}

Booking flow:
1. DO NOT ask for name, email or phone — already on file
2. For nearby doctors: call find_nearby_doctors with lat=${patientContext.lat || 'unknown'} lng=${patientContext.lng || 'unknown'}
3. Ask only: preferred date, time, service, doctor preference
4. Call check_availability → confirm → call book_appointment

Cancellation flow:
1. Call cancel_appointment with patientEmail="${patientContext.email}" and date if known
2. Do NOT ask for an appointment ID — look it up automatically`;
    }

    return `${base}

Booking flow for guest patients:
1. Ask for name → phone → email
2. Read email back to confirm before booking
3. Call check_availability → confirm slot → call book_appointment

Cancellation flow:
1. Ask for patient email and approximate date
2. Call cancel_appointment with those details`;
  }

  /* ── Cooldown helpers ───────────────────────────────────────────── */
  isOnCooldown(model) {
    const until = this.modelCooldowns[model];
    if (!until) return false;
    if (Date.now() < until) return true;
    delete this.modelCooldowns[model];
    return false;
  }
  setCooldown(model, seconds) {
    this.modelCooldowns[model] = Date.now() + seconds * 1000;
    console.warn(`⏳ ${model} cooldown: ${seconds}s`);
  }

  async callWithFallback(messages) {
    const available = this.modelNames.filter(m => !this.isOnCooldown(m));
    if (!available.length) {
      const soonest = this.modelNames.reduce((a, b) =>
        (this.modelCooldowns[a] || 0) < (this.modelCooldowns[b] || 0) ? a : b);
      const wait = Math.max(0, this.modelCooldowns[soonest] - Date.now());
      await new Promise(r => setTimeout(r, wait + 500));
      delete this.modelCooldowns[soonest];
      available.push(soonest);
    }

    let lastError;
    for (const model of available) {
      try {
        console.log(`🤖 Calling Groq: ${model}`);
        const msgList = [...messages];

        let response = await this.client.chat.completions.create({
          model,
          messages:    msgList,
          tools:       this.tools,
          tool_choice: 'auto',
          max_tokens:  parseInt(process.env.AI_ASSISTANT_MAX_TOKENS) || 512,
          temperature: parseFloat(process.env.AI_ASSISTANT_TEMPERATURE) || 0.7,
        });
        let assistantMsg = response.choices[0].message;

        // Agentic tool-call loop
        while (assistantMsg.tool_calls?.length) {
          console.log(`🔧 Tools: ${assistantMsg.tool_calls.map(t => t.function.name).join(', ')}`);
          msgList.push(assistantMsg);

          for (const tc of assistantMsg.tool_calls) {
            let args;
            try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

            // Strip null/undefined/empty-string values — Groq rejects them
            args = Object.fromEntries(
              Object.entries(args).filter(([, v]) =>
                v !== null && v !== undefined && v !== ''
              )
            );

            console.log(`  ↳ ${tc.function.name}`, args);
            const result = await this.executeTool(tc.function.name, args);
            msgList.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
          }

          response = await this.client.chat.completions.create({
            model, messages: msgList, tools: this.tools, tool_choice: 'auto',
            max_tokens: 512, temperature: 0.7,
          });
          assistantMsg = response.choices[0].message;
        }

        // Strip leaked raw function-call syntax (safety net for weaker models)
        let text = assistantMsg.content?.trim() ?? '';
        text = text
          .replace(/<function=[^>]+>[\s\S]*?<\/function>/g, '')
          .replace(/<function=[^>]+>[\s\S]*$/gm, '')
          .trim();

        // FIX: Empty response after tool loop — model responded with only tool
        // calls and no final text. Ask it explicitly for a spoken reply.
        if (!text) {
          const lastToolResult = msgList[msgList.length - 1];
          msgList.push({
            role: 'user',
            content: 'Please give a brief spoken response to the patient based on the tool result above.'
          });
          const retry = await this.client.chat.completions.create({
            model, messages: msgList, max_tokens: 256, temperature: 0.7,
          });
          text = retry.choices[0].message.content?.trim() ?? '';
        }

        if (!text) throw new Error('Empty response');
        console.log(`✅ ${model} responded`);
        return text;

      } catch (err) {
        const status = err?.status ?? err?.statusCode;
        lastError = err;
        if ([429, 503, 500, 502].includes(status)) {
          this.setCooldown(model, status === 429 ? 60 : 30);
          continue;
        }
        throw err;
      }
    }
    throw lastError ?? new Error('All models unavailable');
  }

  async processUserInput(userText, conversationId = null, patientContext = null) {
    try {
      const cleaned = userText?.trim() ?? '';
      if (cleaned.length < 3) return { text: null, conversationId, suppressed: true };

      let conversation;
      if (conversationId) conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        conversation = new Conversation({
          sessionId:    `session_${Date.now()}`,
          messages:     [],
          patientEmail: patientContext?.email || null,
          patientName:  patientContext?.name  || null,
        });
      }

      conversation.messages.push({ role: 'user', content: cleaned, timestamp: new Date() });
      const systemPrompt = this.buildSystemPrompt(patientContext);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content }))
      ];

      const replyText = await this.callWithFallback(messages);
      conversation.messages.push({ role: 'assistant', content: replyText, timestamp: new Date() });
      await conversation.save();
      console.log(`🤖 Sarah: "${replyText}"`);
      return { text: replyText, conversationId: conversation._id };

    } catch (err) {
      console.error('❌ Voice Agent Error:', err);
      return {
        text: "I apologize, but I'm having trouble right now. Could you please try again?",
        conversationId, error: true
      };
    }
  }

  async executeTool(name, args) {
    try {
      switch (name) {
        case 'get_doctors':         return await this.getDoctors(args.specialization);
        case 'find_nearby_doctors': return await this.findNearbyDoctors(args);
        case 'check_availability':  return await this.checkAvailability(args.date, args.doctorId);
        case 'book_appointment':    return await this.bookAppointment(args);
        case 'cancel_appointment':  return await this.cancelAppointment(args);
        case 'get_clinic_info':     return this.getClinicInfo(args.infoType);
        default:                    return { error: 'Unknown tool' };
      }
    } catch (err) {
      console.error(`Tool error (${name}):`, err);
      return { success: false, error: err.message || 'Tool failed' };
    }
  }

  /* ─── get_doctors ──────────────────────────────────────────────── */
  async getDoctors(specialization = undefined) {
    const query = { isActive: true };
    // FIX: guard empty string — model sometimes passes "" instead of omitting
    if (specialization && typeof specialization === 'string' && specialization.trim()) {
      query.specialization = new RegExp(specialization.trim(), 'i');
    }
    const doctors = await Doctor.find(query).select('-password -__v').sort({ rating: -1 });
    if (!doctors.length) return { success: true, doctors: [], message: 'No doctors found.' };
    const list = doctors.map(d => ({
      id:             d._id,
      name:           d.name,
      specialization: d.specialization,
      experience:     `${d.experience} years`,
      qualification:  d.qualification,
      clinicAddress:  d.location?.address || d.address || 'Address not provided',
      placeName:      d.location?.placeName || '',
      phone:          d.phone,
      rating:         d.rating,
    }));
    return {
      success: true, count: list.length, doctors: list,
      summary: list.map(d =>
        `Dr. ${d.name} — ${d.specialization}, ${d.experience}, ${d.qualification}, clinic at ${d.clinicAddress}`
      ).join('; ')
    };
  }

  /* ─── find_nearby_doctors ──────────────────────────────────────── */
  async findNearbyDoctors({ lat, lng, radiusKm = 10, specialization, locationName }) {
    const radiusM = radiusKm * 1000;
    const query = {
      isActive: true,
      location: {
        $nearSphere: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusM,
        },
      },
    };
    if (specialization && typeof specialization === 'string' && specialization.trim()) {
      query.specialization = new RegExp(specialization.trim(), 'i');
    }

    const doctors = await Doctor.find(query).select('-password -__v').limit(10);
    if (!doctors.length) {
      return {
        success: true, doctors: [],
        message: `No doctors found within ${radiusKm}km of ${locationName || 'your location'}. Try increasing the radius.`
      };
    }

    const list = doctors.map(d => {
      const dLng  = d.location?.coordinates?.[0] || 0;
      const dLat  = d.location?.coordinates?.[1] || 0;
      const R     = 6371;
      const dLat2 = ((dLat - lat) * Math.PI) / 180;
      const dLng2 = ((dLng - lng) * Math.PI) / 180;
      const a     = Math.sin(dLat2/2)**2 +
                    Math.cos((lat*Math.PI)/180) * Math.cos((dLat*Math.PI)/180) * Math.sin(dLng2/2)**2;
      const distKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
      return {
        id:             d._id,
        name:           d.name,
        specialization: d.specialization,
        experience:     `${d.experience} years`,
        qualification:  d.qualification,
        clinicAddress:  d.location?.address || d.address || 'Address not provided',
        placeName:      d.location?.placeName || '',
        phone:          d.phone,
        distanceKm:     distKm,
      };
    });

    return {
      success: true, count: list.length,
      searchLocation: locationName || `${lat}, ${lng}`,
      radiusKm, doctors: list,
      summary: list.map(d =>
        `Dr. ${d.name} (${d.specialization}) — ${d.distanceKm}km away, clinic at ${d.clinicAddress}`
      ).join('; ')
    };
  }

  /* ─── check_availability ───────────────────────────────────────── */
  async checkAvailability(date, doctorId = null) {
    const slots  = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
    const query  = { date: new Date(date), status: 'scheduled' };
    if (doctorId) query.doctorId = doctorId;
    const booked    = await Appointment.find(query);
    const taken     = booked.map(a => a.time);
    const available = slots.filter(s => !taken.includes(s));
    return {
      success: true, date, doctorId: doctorId || 'any',
      availableSlots: available,
      message: available.length ? `Available: ${available.join(', ')}` : 'No slots on this date.'
    };
  }

  /* ─── book_appointment ─────────────────────────────────────────── */
  async bookAppointment(data) {
    const rawEmail     = data.patientEmail || '';
    const cleanedEmail = cleanEmail(rawEmail);
    if (!isValidEmail(cleanedEmail)) {
      return { success: false, message: `The email "${rawEmail}" doesn't look valid. Please confirm.` };
    }

    const existing = await Appointment.findOne({
      date: new Date(data.date), time: data.time, status: 'scheduled',
      ...(data.doctorId ? { doctorId: data.doctorId } : {})
    });
    if (existing) return { success: false, message: 'Slot unavailable. Choose another time.' };

    let doctor = null;
    if (data.doctorId)        doctor = await Doctor.findById(data.doctorId).catch(() => null);
    if (!doctor && data.doctorName) doctor = await Doctor.findOne({ name: new RegExp(data.doctorName.replace(/^Dr\.?\s*/i, '').trim(), 'i') });

    const appt = new Appointment({
      patientName:  data.patientName,
      patientPhone: data.patientPhone,
      patientEmail: cleanedEmail,
      date:    new Date(data.date),
      time:    data.time,
      service: data.service,
      notes:   data.notes || '',
      status:  'scheduled',
      doctorId: doctor?._id || null,
      dentist:  doctor ? `Dr. ${doctor.name}` : (data.doctorName || 'Dr. Smith'),
    });
    await appt.save();

    try { await emailService.sendAppointmentConfirmation(appt, { name: data.patientName, email: cleanedEmail }); }
    catch (e) { console.warn('⚠️ Patient email failed:', e.message); }

    if (doctor?.email) {
      try { await emailService.sendDoctorAppointmentNotification(appt, doctor, { name: data.patientName, email: cleanedEmail, phone: data.patientPhone }); }
      catch (e) { console.warn('⚠️ Doctor email failed:', e.message); }
    }

    const clinicAddr = doctor?.location?.address || doctor?.address || '';
    return {
      success: true,
      appointmentId: appt._id.toString(),
      clinicAddress: clinicAddr,
      message: `${data.service} booked for ${data.date} at ${data.time} with ${appt.dentist}${clinicAddr ? ` at ${clinicAddr}` : ''}. Confirmation sent to ${cleanedEmail}.`
    };
  }

  /* ─── cancel_appointment ───────────────────────────────────────── */
  // FIX: Model was passing fake IDs like "12345". Now supports lookup by
  // patientEmail + date so cancellation works without a real ObjectId.
  async cancelAppointment({ appointmentId, patientEmail, date, reason = '' }) {
    let appt = null;

    // Try by real ObjectId first (only if it looks like one)
    if (appointmentId && /^[a-f\d]{24}$/i.test(appointmentId)) {
      appt = await Appointment.findById(appointmentId);
    }

    // Fallback: look up most recent scheduled appointment for this patient
    if (!appt && patientEmail) {
      const query = { patientEmail: patientEmail.toLowerCase(), status: 'scheduled' };
      if (date) query.date = new Date(date);
      appt = await Appointment.findOne(query).sort({ date: 1 }); // nearest upcoming
    }

    if (!appt) {
      return {
        success: false,
        message: 'No scheduled appointment found. Please check the details and try again.'
      };
    }

    appt.status = 'cancelled';
    await appt.save();

    try { await emailService.sendCancellationEmail(appt, { name: appt.patientName, email: appt.patientEmail }); }
    catch (e) { console.warn('⚠️ Cancel email failed:', e.message); }

    return {
      success: true,
      message: `Appointment on ${appt.date.toDateString()} at ${appt.time} with ${appt.dentist} has been cancelled.`,
      appointmentId: appt._id.toString()
    };
  }

  /* ─── get_clinic_info ──────────────────────────────────────────── */
  getClinicInfo(infoType) {
    const info = {
      address:   process.env.CLINIC_ADDRESS        || '123 Dental Ave, Suite 100, New York, NY 10001',
      phone:     process.env.CLINIC_PHONE           || '+1 (555) 123-4567',
      hours:     'Monday-Friday: 9am-6pm, Saturday: 10am-4pm, Sunday: Closed',
      emergency: process.env.CLINIC_EMERGENCY_PHONE || '+1 (555) 911-0123',
    };
    if (infoType === 'all') return { success: true, ...info };
    return { success: true, [infoType]: info[infoType] };
  }
}

module.exports = new VoiceAgentService();