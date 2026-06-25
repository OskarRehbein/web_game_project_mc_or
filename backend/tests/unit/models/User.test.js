import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../../src/models/User.js';

describe('User Model Unit Tests', () => {
    let mongoServer;

    // 1. DATO BASE (Clean Code): Centralizamos un payload 100% válido.
    // Así garantizamos que cuando queramos que algo falle, sea estrictamente por el campo que estamos alterando.
    const validUserPayload = {
        email: 'test@game.com',
        password: 'SuperSecretPassword123'
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    }, 30000);

    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    });

    afterAll(async () => {
        try {
            await mongoose.connection.close();
            if (mongoServer) {
                await mongoServer.stop();
            }
        } catch (error) {
            console.error("Error cerrando DB de test:", error);
        }
    }, 20000);

    // --- TESTS DE CREACIÓN Y CAMPOS POR DEFECTO ---

    it('Debe crear un usuario válido con el rol por defecto y timestamps', async () => {
        const user = new User(validUserPayload);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(validUserPayload.email);
        expect(savedUser.role).toBe('player');
        expect(savedUser.createdAt).toBeDefined(); // Validando timestamps
        expect(savedUser.updatedAt).toBeDefined();
    });

    // --- TESTS DE MÉTODOS Y LÓGICA ---

    it('Debe encriptar la contraseña antes de guardarla (pre-save hook)', async () => {
        const user = new User(validUserPayload);
        const savedUser = await user.save();

        expect(savedUser.password).not.toBe(validUserPayload.password);
        // Validamos el prefijo estándar de un hash de bcrypt
        expect(savedUser.password).toMatch(/^\$2[abxy]\$10\$/);
    });

    it('Debe retornar true si las contraseñas coinciden usando comparePassword', async () => {
        const user = new User(validUserPayload);
        const savedUser = await user.save();

        const isMatch = await savedUser.comparePassword(validUserPayload.password);
        expect(isMatch).toBe(true);
    });

    it('Debe retornar false si las contraseñas no coinciden usando comparePassword', async () => {
        const user = new User(validUserPayload);
        const savedUser = await user.save();

        const isMatch = await savedUser.comparePassword('ClaveIncorrecta999');
        expect(isMatch).toBe(false);
    });

    // --- TESTS DE VALIDACIÓN DE SCHEMAS ---
    // Usamos validateSync() porque son validaciones de Mongoose, no de la BD.

    it('Debe fallar si no se proporciona una contraseña', async () => {
        const userWithoutPassword = new User({ email: 'nopass@game.com' });
        const validationError = userWithoutPassword.validateSync();

        expect(validationError.errors.password).toBeDefined();
        expect(validationError.errors.password.message).toBe('La contraseña es obligatoria');
    });

    it('Debe fallar si la contraseña tiene menos de 6 caracteres', async () => {
        // Mantenemos el email válido, solo corrompemos la password
        const userShortPassword = new User({ ...validUserPayload, password: '123' });
        const validationError = userShortPassword.validateSync();

        expect(validationError.errors.password).toBeDefined();
        expect(validationError.errors.password.message).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('Debe fallar si el formato del email es inválido', async () => {
        // Mantenemos la password válida, solo corrompemos el email
        const userBadEmail = new User({ ...validUserPayload, email: 'correo-falso' });
        const validationError = userBadEmail.validateSync();

        expect(validationError.errors.email).toBeDefined();
        expect(validationError.errors.email.message).toBe('Debe proporcionar un email válido');
    });

    // --- TESTS DE RESTRICCIONES DE BASE DE DATOS ---

    it('Debe fallar si el email ya existe (Violación de índice Unique)', async () => {
        // Aseguramos que los índices de Mongoose estén construidos en MongoDB Memory Server
        await User.init();

        const user1 = new User(validUserPayload);
        await user1.save();

        // Usamos un email duplicado pero una password 100% válida para sortear validateSync()
        const user2 = new User({ ...validUserPayload, password: 'OtraPasswordValida123' });

        await expect(user2.save()).rejects.toThrow(/E11000 duplicate key error/);
    });
});