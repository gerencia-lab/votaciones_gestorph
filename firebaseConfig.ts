
import * as firebaseApp from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import * as firebaseAuth from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Workaround for module resolution issues where named exports are not recognized by TS
const { initializeApp, getApps, getApp } = firebaseApp as any;
const { getAuth } = firebaseAuth as any;

/**
 * Helper para obtener variables de entorno de manera segura.
 * Evita el error "Cannot read properties of undefined" verificando la existencia de los objetos.
 */
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignorar errores de acceso a import.meta
  }

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignorar errores de acceso a process
  }

  return fallback;
};

// Configuración Oficial - Proyecto: gestorph-votaciones
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyBttSk8DBj2-n8g-yz6XCZiBCmvnNEMOzw"),
  authDomain: "gestorph-votaciones.firebaseapp.com",
  projectId: "gestorph-votaciones",
  storageBucket: "gestorph-votaciones.firebasestorage.app",
  messagingSenderId: "59531366232",
  appId: "1:59531366232:web:cf90b6c9150cbd151cdf2d",
  measurementId: "G-BSV93C5VYZ"
};

// Inicializar la aplicación de Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Inicializar Firestore.
 */
export const db = initializeFirestore(app, {});

/**
 * Inicializar Storage para audios y actas
 */
export const storage = getStorage(app);

/**
 * Inicializar Auth
 */
export const auth = getAuth(app);

/**
 * Inicializar Cloud Functions
 */
export const functions = getFunctions(app);

/**
 * Helper para verificar el estado de la configuración.
 */
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;
};
