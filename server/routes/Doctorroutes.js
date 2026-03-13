'use strict';

const express = require('express');
const router  = express.Router();
const Doctor  = require('../models/doctor');
const { protect, authorize, signToken, generateToken } = require('../middleware/Authmiddleware');

/* ================================================================
   GEOCODING HELPER — OpenStreetMap Nominatim (free, no API key)
   Called automatically during registration if no map pin is set
   or if coordinates are [0, 0].

   Requires: npm install node-fetch@2
================================================================ */
let _fetch;
async function getFetch() {
  if (!_fetch) {
    try { _fetch = (await import('node-fetch')).default; }
    catch { _fetch = require('node-fetch'); }
  }
  return _fetch;
}

async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;
  try {
    const fetch = await getFetch();
    const url   = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1`;
    const res   = await fetch(url, {
      headers: { 'User-Agent': 'SmileCare-Dental/1.0 (dental clinic app)' },
      timeout: 5000,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0]) {
      return {
        coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
        placeName:   data[0].display_name?.split(',')[0]?.trim() || '',
        fullAddress: data[0].display_name || address,
      };
    }
  } catch (e) {
    console.warn('⚠️  Geocode failed:', e.message);
  }
  return null;
}

/* ── Resolve location helper ────────────────────────────────────────
   Takes the location object from request body + the address string,
   returns a clean flat GeoJSON location object ready to save.

   Handles three cases:
   1. Correct flat GeoJSON from updated frontend  → use directly
   2. Old nested bug { type: { type:'Point' } }   → flatten it
   3. [0,0] or missing coordinates                → geocode from address
────────────────────────────────────────────────────────────────── */
async function resolveLocation(location, address) {
  let coords    = null;
  let addrStr   = '';
  let placeName = '';

  if (location) {
    // Case A: nested bug from old frontend — { type: { type:'Point', coordinates:[...] } }
    if (location.type && typeof location.type === 'object' && location.type.coordinates) {
      coords    = location.type.coordinates;
      addrStr   = location.address   || address || '';
      placeName = location.placeName || '';
      console.log('⚠️  Fixed nested location bug from old frontend payload');
    }
    // Case B: correct flat GeoJSON — { type:'Point', coordinates:[lng,lat] }
    else if (Array.isArray(location.coordinates)) {
      coords    = location.coordinates;
      addrStr   = location.address   || address || '';
      placeName = location.placeName || '';
    }
  }

  // Case C: coordinates are [0,0] or missing — geocode from address
  const isZero = !coords || (coords[0] === 0 && coords[1] === 0);
  if (isZero && address && address.trim()) {
    console.log(`📍 Geocoding address: "${address.trim()}"`);
    const geo = await geocodeAddress(address);
    if (geo) {
      coords    = geo.coordinates;
      addrStr   = addrStr || geo.fullAddress;
      placeName = placeName || geo.placeName;
      console.log(`  ✅ Resolved to [${coords}]`);
    } else {
      console.warn('  ⚠️  Geocode returned no results — will store [0,0]');
    }
  }

  if (!coords) return null;

  return {
    type:        'Point',
    coordinates: coords,
    address:     addrStr   || address || '',
    placeName:   placeName || '',
  };
}

// ── Public: nearby doctors (geospatial) ──────────────────────────────────
// GET /api/doctors/nearby?lat=12.97&lng=77.59&radius=5000&specialization=
// radius is in metres, default 10 km
router.get('/nearby', async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 10000; // metres

    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ success: false, error: 'lat and lng are required query params' });

    const query = {
      isActive: true,
      'location.coordinates': { $ne: [0, 0] }, // exclude ungeocoded doctors
      location: {
        $nearSphere: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    };

    if (req.query.specialization)
      query.specialization = new RegExp(req.query.specialization, 'i');

    const doctors = await Doctor.find(query).select('-password -__v').limit(20);

    // Attach distance in metres and km for display
    const withDist = doctors.map(d => {
      const obj  = d.toObject();
      const dLng = d.location?.coordinates?.[0] || 0;
      const dLat = d.location?.coordinates?.[1] || 0;
      const R    = 6371000;
      const dLat2 = ((dLat - lat) * Math.PI) / 180;
      const dLng2 = ((dLng - lng) * Math.PI) / 180;
      const a    = Math.sin(dLat2/2)**2 +
                   Math.cos((lat*Math.PI)/180) * Math.cos((dLat*Math.PI)/180) *
                   Math.sin(dLng2/2)**2;
      obj.distanceMetres = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      obj.distanceKm     = (obj.distanceMetres / 1000).toFixed(1);
      return obj;
    });

    res.json({ success: true, count: withDist.length, doctors: withDist });
  } catch (err) {
    console.error('Nearby query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Public: list all active doctors ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .select('-password -__v')
      .sort({ experience: -1 });
    res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Public: single doctor ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password -__v');
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Public: doctor self-registration ─────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, specialization, qualification,
      experience, phone, address, bio, availableDays, availableSlots,
      consultationFee, location,
    } = req.body;

    if (!name || !email || !password || !specialization || !qualification || !experience)
      return res.status(400).json({ success: false, error: 'Please fill all required fields' });

    if (await Doctor.findOne({ email }))
      return res.status(400).json({ success: false, error: 'Email already registered' });

    // Auto-resolve location: fixes nested bug, geocodes if [0,0]
    const resolvedLocation = await resolveLocation(location, address);

    const doctor = await Doctor.create({
      name, email, password, specialization, qualification,
      experience:      Number(experience),
      phone:           phone           || '',
      address:         address         || '',
      bio:             bio             || '',
      consultationFee: consultationFee ? Number(consultationFee) : 500,
      availableDays:   availableDays   || ['Monday','Tuesday','Wednesday','Thursday','Friday'],
      availableSlots:  availableSlots  || ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'],
      ...(resolvedLocation ? { location: resolvedLocation } : {}),
    });

    const token     = generateToken(doctor._id);
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    console.log(`✅ New doctor registered: ${doctor.name} (${doctor.email}) — coords: [${resolvedLocation?.coordinates || '0,0'}]`);
    res.status(201).json({ success: true, token, doctor: doctorObj });
  } catch (err) {
    console.error('Doctor register error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin: create doctor ──────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name, email, password, specialization, qualification,
      experience, phone, address, bio, availableDays, availableSlots,
      consultationFee, location,
    } = req.body;

    if (await Doctor.findOne({ email }))
      return res.status(400).json({ success: false, error: 'Email already registered' });

    const resolvedLocation = await resolveLocation(location, address);

    const doctor = await Doctor.create({
      name, email, password, specialization, qualification,
      experience, phone, address, bio, consultationFee,
      availableDays, availableSlots,
      ...(resolvedLocation ? { location: resolvedLocation } : {}),
    });

    const token     = signToken(doctor._id);
    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    res.status(201).json({ success: true, token, doctor: doctorObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Doctor/Admin: update profile ──────────────────────────────────────────
router.put('/:id', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    if (req.user.role === 'doctor' && req.user._id.toString() !== req.params.id)
      return res.status(403).json({ success: false, error: 'Not authorized' });

    const updateData = { ...req.body };

    // Re-resolve location if address or location changed
    if (req.body.location || req.body.address) {
      const resolved = await resolveLocation(req.body.location, req.body.address);
      if (resolved) updateData.location = resolved;
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true,
    }).select('-password');

    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin: fix ALL existing [0,0] doctors by geocoding their address ───────
// POST /api/doctors/fix-coordinates  (admin only, run once)
// This repairs all doctors registered before the geocoding fix.
router.post('/fix-coordinates', protect, authorize('admin'), async (req, res) => {
  try {
    const zeroDocs = await Doctor.find({
      $or: [
        { 'location.coordinates': [0, 0] },
        { 'location.coordinates': { $exists: false } },
        { location: { $exists: false } },
      ]
    });

    console.log(`🔧 Fixing coordinates for ${zeroDocs.length} doctor(s)…`);
    const results = [];

    for (const doc of zeroDocs) {
      const address = doc.location?.address || doc.address;
      if (!address) {
        results.push({ name: doc.name, status: 'skipped — no address' });
        continue;
      }

      const geo = await geocodeAddress(address);
      if (!geo) {
        results.push({ name: doc.name, status: 'geocode failed' });
        continue;
      }

      await Doctor.findByIdAndUpdate(doc._id, {
        $set: {
          'location.type':        'Point',
          'location.coordinates': geo.coordinates,
          'location.address':     doc.location?.address || geo.fullAddress || address,
          'location.placeName':   geo.placeName || '',
        }
      });
      results.push({ name: doc.name, coords: geo.coordinates, place: geo.placeName, status: 'fixed' });
      console.log(`  ✅ ${doc.name} → [${geo.coordinates}] (${geo.placeName})`);

      // Nominatim requires max 1 request/second
      await new Promise(r => setTimeout(r, 1100));
    }

    const fixed = results.filter(r => r.status === 'fixed').length;
    console.log(`✅ Done — fixed ${fixed}/${zeroDocs.length} doctors`);
    res.json({ success: true, total: zeroDocs.length, fixed, results });
  } catch (err) {
    console.error('fix-coordinates error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin: deactivate doctor ──────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;