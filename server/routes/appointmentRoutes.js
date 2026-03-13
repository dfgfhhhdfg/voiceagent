const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/doctor");
const emailService = require("../services/emailService");

function formatDoctorName(rawName) {
  if (!rawName) return "";
  const trimmed = String(rawName).trim();
  return /^Dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

// ====================================
// GET ROUTES
// ====================================

// Get all appointments (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { date, status, patientName, startDate, endDate } = req.query;
    let query = {};

    // Filter by date
    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59)),
      };
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by patient name (case-insensitive partial match)
    if (patientName) {
      query.patientName = { $regex: patientName, $options: "i" };
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 })
      .limit(100); // Limit to 100 records for performance

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
});

// Get single appointment by ID
router.get("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message,
    });
  }
});

// Get appointments by patient email
router.get("/patient/:email", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientEmail: req.params.email,
    }).sort({ date: -1 }); // Most recent first

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient appointments",
      error: error.message,
    });
  }
});

// Get appointments by patient phone
router.get("/phone/:phone", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientPhone: req.params.phone,
    }).sort({ date: -1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient appointments",
      error: error.message,
    });
  }
});

// Get upcoming appointments (today and future)
router.get("/status/upcoming", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      date: { $gte: today },
      status: "scheduled",
    }).sort({ date: 1, time: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming appointments",
      error: error.message,
    });
  }
});

// Get today's appointments
router.get("/status/today", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: "scheduled",
    }).sort({ time: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's appointments",
      error: error.message,
    });
  }
});

// Check availability for a specific date
router.get("/availability/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Define available time slots (9 AM to 5 PM, hourly)
    const allSlots = [
      "09:00",
      "10:00",
      "11:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ];

    // Find booked appointments for this date
    const bookedAppointments = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: "scheduled",
    });

    const bookedTimes = bookedAppointments.map((apt) => apt.time);
    const availableSlots = allSlots.filter(
      (slot) => !bookedTimes.includes(slot),
    );

    res.json({
      success: true,
      date: req.params.date,
      allSlots,
      bookedTimes,
      availableSlots,
      isFullyBooked: availableSlots.length === 0,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
      error: error.message,
    });
  }
});

// ====================================
// POST ROUTES (CREATE)
// ====================================

// Create new appointment
router.post("/", async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      date,
      time,
      service,
      dentist,
      notes,
    } = req.body;
    const doctorId = req.body.doctorId || req.body.doctor;

    // Validate required fields
    if (
      !patientName ||
      !patientPhone ||
      !patientEmail ||
      !date ||
      !time ||
      !service
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: patientName, patientPhone, patientEmail, date, time, service",
      });
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      status: "scheduled",
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Create appointment
    let doctorDoc = null;
    if (doctorId) {
      doctorDoc = await Doctor.findById(doctorId)
        .select("-password -__v")
        .catch(() => null);
    }
    if (!doctorDoc && dentist) {
      const normalized = dentist.replace(/^Dr\.?\s*/i, "").trim();
      if (normalized) {
        doctorDoc = await Doctor.findOne({
          name: new RegExp(`^${normalized}$`, "i"),
        })
          .select("-password -__v")
          .catch(() => null);
      }
    }

    const appointment = new Appointment({
      patientName,
      patientPhone,
      patientEmail,
      date: new Date(date),
      time,
      service,
      dentist: doctorDoc
        ? formatDoctorName(doctorDoc.name)
        : dentist || "Dr. Smith",
      notes: notes || "",
      status: "scheduled",
      doctor: doctorDoc?._id || null,
    });

    await appointment.save();

    // Send confirmation email
    try {
      const doctorPayload = doctorDoc
        ? {
            name: formatDoctorName(doctorDoc.name),
            specialization: doctorDoc.specialization,
            qualification: doctorDoc.qualification,
            experience: doctorDoc.experience,
            consultationFee: doctorDoc.consultationFee,
            phone: doctorDoc.phone,
          }
        : { name: appointment.dentist };
      await emailService.sendAppointmentConfirmation(
        appointment,
        doctorPayload,
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the appointment creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error.message,
    });
  }
});

// Bulk create appointments (for testing)
router.post("/bulk", async (req, res) => {
  try {
    const appointments = req.body.appointments;

    if (!Array.isArray(appointments)) {
      return res.status(400).json({
        success: false,
        message: "Appointments must be an array",
      });
    }

    const createdAppointments = await Appointment.insertMany(appointments);

    res.status(201).json({
      success: true,
      message: `Created ${createdAppointments.length} appointments`,
      appointments: createdAppointments,
    });
  } catch (error) {
    console.error("Error bulk creating appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointments",
      error: error.message,
    });
  }
});

// ====================================
// PUT ROUTES (UPDATE)
// ====================================

// Update appointment
router.put("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;
    const oldService = appointment.service;

    // If date or time is being changed, check availability
    if (req.body.date || req.body.time) {
      const newDate = req.body.date
        ? new Date(req.body.date)
        : appointment.date;
      const newTime = req.body.time || appointment.time;

      // Skip check if updating the same appointment
      if (
        newDate.toDateString() !== appointment.date.toDateString() ||
        newTime !== appointment.time
      ) {
        const existingAppointment = await Appointment.findOne({
          date: newDate,
          time: newTime,
          status: "scheduled",
          _id: { $ne: req.params.id }, // Exclude current appointment
        });

        if (existingAppointment) {
          return res.status(409).json({
            success: false,
            message: "The requested time slot is already booked",
          });
        }
      }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : appointment.date,
      },
      { new: true, runValidators: true },
    );

    // Send reschedule email if date or time changed
    if (req.body.date || req.body.time) {
      try {
        await emailService.sendRescheduleConfirmation(
          updatedAppointment,
          {
            name: updatedAppointment.patientName,
            email: updatedAppointment.patientEmail,
          },
          oldDate.toLocaleDateString(),
          oldTime,
        );
      } catch (emailError) {
        console.error("Failed to send reschedule email:", emailError);
      }
    }

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error.message,
    });
  }
});

// Reschedule appointment (convenience method)
router.put("/:id/reschedule", async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;

    // Check availability
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      status: "scheduled",
      _id: { $ne: req.params.id },
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "The requested time slot is already booked",
      });
    }

    appointment.date = new Date(date);
    appointment.time = time;
    await appointment.save();

    // Send reschedule email
    try {
      await emailService.sendRescheduleConfirmation(
        appointment,
        {
          name: appointment.patientName,
          email: appointment.patientEmail,
        },
        oldDate.toLocaleDateString(),
        oldTime,
      );
    } catch (emailError) {
      console.error("Failed to send reschedule email:", emailError);
    }

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule appointment",
      error: error.message,
    });
  }
});

// ====================================
// PATCH ROUTES (PARTIAL UPDATE)
// ====================================

// Update appointment status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["scheduled", "completed", "cancelled", "no-show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send email for cancellation
    if (status === "cancelled") {
      try {
        await emailService.sendCancellationEmail(appointment, {
          name: appointment.patientName,
          email: appointment.patientEmail,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    res.json({
      success: true,
      message: `Appointment marked as ${status}`,
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
});

// Add notes to appointment
router.patch("/:id/notes", async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { notes } },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Notes added successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error adding notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add notes",
      error: error.message,
    });
  }
});

// ====================================
// DELETE ROUTES
// ====================================

// Delete appointment (soft delete by changing status)
router.delete("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Soft delete - change status to cancelled
    appointment.status = "cancelled";
    await appointment.save();

    // Send cancellation email
    try {
      await emailService.sendCancellationEmail(appointment, {
        name: appointment.patientName,
        email: appointment.patientEmail,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
});

// Hard delete (for testing/cleanup - use carefully!)
router.delete("/:id/hard", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message,
    });
  }
});

// ====================================
// STATISTICS ROUTES
// ====================================

// Get appointment statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      yearAppointments,
      statusCounts,
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay },
      }),
      Appointment.countDocuments({
        date: { $gte: startOfWeek },
      }),
      Appointment.countDocuments({
        date: { $gte: startOfMonth },
      }),
      Appointment.countDocuments({
        date: { $gte: startOfYear },
      }),
      Appointment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Get most popular services
    const popularServices = await Appointment.aggregate([
      {
        $group: {
          _id: "$service",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      statistics: {
        total: totalAppointments,
        today: todayAppointments,
        thisWeek: weekAppointments,
        thisMonth: monthAppointments,
        thisYear: yearAppointments,
        byStatus: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        popularServices,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// Send reminder for specific appointment
router.post("/:id/send-reminder", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await emailService.sendAppointmentReminder(appointment, {
      name: appointment.patientName,
      email: appointment.patientEmail,
    });

    res.json({
      success: true,
      message: "Reminder email sent successfully",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reminder",
      error: error.message,
    });
  }
});

module.exports = router;
