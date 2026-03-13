const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
    },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 500 },

    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: String, default: "" },

    // ── Geospatial ─────────────────────────────────────────────────────
    // Correct flat GeoJSON structure:
    //   location: { type: "Point", coordinates: [lng, lat], address: "", placeName: "" }
    //
    // The nested bug { type: { type: "Point", coordinates: [...] } } came from
    // wrapping the GeoJSON sub-doc in an extra Mongoose { type: ... } declaration.
    // Fixed below by using 'Object' type so Mongoose doesn't reinterpret it.
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: "" },
      placeName: { type: String, default: "" },
    },

    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    availableSlots: {
      type: [String],
      default: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    },

    isActive: { type: Boolean, default: true },
    role: { type: String, default: "doctor" },
  },
  { timestamps: true },
);

// 2dsphere index on the GeoJSON field
doctorSchema.index({ location: "2dsphere" });

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

doctorSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

/* ─────────────────────────────────────────────────────────────────────
   Auto-fix on startup — two steps:

   STEP 1 — Migrate corrupt documents.
   Old schema wrapped location in an extra { type: { type: "Point" } }
   layer. MongoDB cannot build a 2dsphere index on that structure.
   We flatten every such document to { type: "Point", coordinates: [...] }.

   STEP 2 — Drop any stale 2dsphere indexes and recreate the correct one.
   Runs once per server start, safe to repeat.
───────────────────────────────────────────────────────────────────── */
async function fixDoctorGeo() {
  try {
    const col = mongoose.connection.collection("doctors");

    /* ── Step 1: fix corrupt location documents ── */
    const badDocs = await col
      .find({
        "location.type.type": { $exists: true }, // nested bug signature
      })
      .toArray();

    if (badDocs.length) {
      console.log(
        `🔧 Fixing ${badDocs.length} doctor(s) with corrupt location data…`,
      );
      for (const doc of badDocs) {
        const inner = doc.location?.type; // { type: "Point", coordinates: [...] }
        const coords = inner?.coordinates;
        const isValidCoords =
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords.every((n) => typeof n === "number");
        await col.updateOne(
          { _id: doc._id },
          {
            $set: {
              "location.type": "Point",
              "location.coordinates": isValidCoords ? coords : [0, 0],
            },
          },
        );
        console.log(
          `  ✅ Fixed: ${doc.name} → coordinates ${isValidCoords ? coords : [0, 0]}`,
        );
      }
    }

    /* ── Step 2: drop wrong indexes, recreate correct one ── */
    const indexes = await col.indexes();
    for (const idx of indexes) {
      const is2d = Object.values(idx.key).includes("2dsphere");
      const isCorrect =
        idx.key.location === "2dsphere" && Object.keys(idx.key).length === 1;
      if (is2d && !isCorrect) {
        console.log(`🗑️  Dropping stale geo index: ${idx.name}`);
        await col.dropIndex(idx.name);
      }
    }

    await col.createIndex({ location: "2dsphere" }, { background: true });
    console.log('✅ Doctor geo index OK: { location: "2dsphere" }');
  } catch (err) {
    console.error("⚠️  Geo fix failed:", err.message);
  }
}

mongoose.connection.once("open", fixDoctorGeo);

module.exports = mongoose.model("Doctor", doctorSchema);
