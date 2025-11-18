// src/app.js
import express from 'express';
import cors from 'cors';

// Middlewares globais
import successHandler from '../middlewares/successHandler.js';
import errorHandler from '../middlewares/errorHandler.js';

// Auth routes
import { router as registerRoute } from './auth/routes/registerRoute.js';
import { router as loginRoute } from './auth/routes/loginRoute.js';
import { router as logoutRoute } from './auth/routes/logoutRoute.js';
import { router as getMeRoute } from './auth/routes/getMeRoute.js';

// User routes (STAFF / gerais)
import { router as listUsersRoute } from './users/listUsersRoute.js';
import { router as emailCheckRoute } from './users/emailCheckRoute.js';
import { router as updateUserStaffRoute } from './users/staffRoutes/updateUserStaff.js';
import { router as deleteUserStaffRoute } from './users/staffRoutes/deleteUserStaff.js';

// Admin routes (RBAC avançado)
import { router as adminUpdateAllStaffRoute } from './users/adminRoutes/adminUpdateAllStaffRoute.js';
import { router as adminDeleteAllStaffRoute } from './users/adminRoutes/adminDeleteAllStaffRoute.js';

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Adiciona res.success em todas as rotas
app.use(successHandler);

// 🔐 Rotas de autenticação
app.use('/', registerRoute);
app.use('/', loginRoute);
app.use('/', logoutRoute);
app.use('/', getMeRoute);

// 👥 Rotas de usuários (self / gerais / helpers)
app.use('/', listUsersRoute);
app.use('/', emailCheckRoute);
app.use('/', updateUserStaffRoute);
app.use('/', deleteUserStaffRoute);

// 🛡️ Rotas ADMIN (RBAC completo)
app.use('/', adminUpdateAllStaffRoute);
app.use('/', adminDeleteAllStaffRoute);

// Middleware global de erro (sempre por último)
app.use(errorHandler);

export default app;
