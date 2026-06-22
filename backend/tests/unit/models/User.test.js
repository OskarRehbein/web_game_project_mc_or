import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../../src/models/User.js';

describe('User Model Unit Tests', () => {
    let mongoServer;

    // 1. Levantar DB en memoria antes de todos los tests
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    // 2. Limpiar colecciones después de cada test para evitar contaminación
    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    });

    // 3. Cerrar conexión al terminar
    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    it('Debe crear un usuario válido con el rol por defecto', async () => {
        const validUser = new User({
            email: 'test@game.com',
            password: 'SuperSecretPassword123'
        });

        const savedUser = await validUser.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe('test@game.com');
        expect(savedUser.role).toBe('player'); // Validando el default del design.md
        expect(savedUser.password).not.toBe('SuperSecretPassword123'); // Validando que el hash se aplicó
    });

    it('Debe fallar si no se proporciona una contraseña', async () => {
        const userWithoutPassword = new User({ email: 'nopass@game.com' });

        const validationError = userWithoutPassword.validateSync();
        expect(validationError.errors.password).toBeDefined();
    });

    it('Debe fallar si el formato del email es inválido', async () => {
        const userBadEmail = new User({ email: 'correo-falso', password: '123' });

        const validationError = userBadEmail.validateSync();
        expect(validationError.errors.email).toBeDefined();
    });

    it('Debe fallar si el email ya existe (Violación de índice Unique)', async () => {
        const user1 = new User({ email: 'duplicate@game.com', password: '123' });
        await user1.save();

        const user2 = new User({ email: 'duplicate@game.com', password: '456' });

        await expect(user2.save()).rejects.toThrow(/E11000 duplicate key error/);
    });
});