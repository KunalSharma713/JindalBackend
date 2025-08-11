const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const roleSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true, // Make slug unique in DB
    },
    is_active: {
        type: Boolean,
        default: true
    }
});

// Pre-save middleware to auto-generate slug from name
roleSchema.pre("save", async function (next) {
    if (this.isModified("name")) {
        // Generate slug
        let baseSlug = slugify(this.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        // Ensure uniqueness
        const Role = this.constructor;
        while (await Role.findOne({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        this.slug = slug;
    }
    next();
});

module.exports = mongoose.model("Roles", roleSchema);
