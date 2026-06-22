import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Debe proporcionar un email válido'
            ]
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
        },
        role: {
            type: String,
            enum: ['player', 'admin'],
            default: 'player'
        }
    },
    {
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
        versionKey: false // Remueve el campo __v interno de Mongoose
    }
);

// Middleware (Hook) para encriptar la contraseña antes de guardar
userSchema.pre('save', async function (next) {
    // Solo aplicamos el hash si la contraseña ha sido modificada o es nueva
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const saltRounds = 10;
        const salt = await bcryptjs.genSalt(saltRounds);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método de instancia para comparar contraseñas en el login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;