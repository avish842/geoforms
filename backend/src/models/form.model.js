import mongoose from "mongoose";

/* -------------------- Field Schema -------------------- */
const fieldSchema = new mongoose.Schema(
  {
    id: {
      type: String, // stable id for answers map
      required: true,
    },

    label: {  // e.g. "Email Address", "Feedback", "Age"  
      type: String,
      default: "Question",
      trim: true,
    },

    type: {
      type: String,
      default: "Multiple Choice",
      required: true, // text, textarea, number, email, date, radio, checkbox, select, file
    },

    options: [
      { text :String,
        value:String,
        image:mongoose.Schema.Types.Mixed
      },
    ],

    required: {
      type: Boolean,
      default: false,
    },

    validation: {
      type: Object, // { regex, min, max, maxLength, hint }
      default: {},
    },
  },
  { _id: false }
);






/* -------------------- Form Schema -------------------- */
const formSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Form",
      trim: true,
    },

    description: {
      type: String,
      default: " No description",
      trim: true,
    },

    fields: [fieldSchema],

    settings: {
      emailDomainWhitelist: [
        {
          type: String, // e.g. ['nitkkr.ac.in']
        },
      ],

      geofence: new mongoose.Schema(
        {
          type: {
            $type: String,
            enum: ["Polygon", "Point"],
          },
          coordinates: {
            $type: mongoose.Schema.Types.Mixed, // Polygon: [[[lng,lat],...]] | Point: [lng,lat]
          },
          radius: {
            $type: Number, // metres – only for Point
            default: null,
          },
        },
        { _id: false, typeKey: "$type" }
      ),
      submissionLimitPerUser: {
        type: Number,
        default: null, // null means no limit
      },

      timeWindow:{
        start:{
          type: Date,
          default: null,
        },
        end:{
          type: Date,
          default: null,
        }
      },

      // allowEmbeds: {
      //   type: Boolean,
      //   default: true,
      // },

      maxFileSizeMB: {
        type: Number,
        default: 10,
      },

      allowedFileTypes: [
        {
          type: String,
          default: [],
        },
      ],
    } ,

    isActive: {
      type: Boolean,
      default: false,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  
  {
    timestamps: true,
  }
);

/* Strip empty geofence before save so the 2dsphere index is never triggered on junk data */
formSchema.pre("validate", function (next) {
  const gf = this.settings?.geofence;
  if (gf && (!gf.type || !gf.coordinates)) {
    this.settings.geofence = undefined;
  }
  next();
});

formSchema.index(
  { "settings.geofence": "2dsphere" },
  {
    partialFilterExpression: {
      "settings.geofence.type": { $exists: true },
      "settings.geofence.coordinates": { $exists: true },
    },
  }
);

const Form = mongoose.model("Form", formSchema);

export { Form };
