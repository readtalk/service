// app/services/session.server.ts
import { createCookieSessionStorage } from "react-router";

// 1. Buat storage untuk sesi berbasis cookie
//    Cookie ini akan dikirim ke browser dan berisi data user yang sudah di-encrypt.
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // Nama cookie di browser
    httpOnly: true, // Tidak bisa diakses oleh JavaScript di browser (lebih aman)
    secure: process.env.NODE_ENV === "production", // Hanya dikirim lewat HTTPS di production
    secrets: [process.env.SESSION_SECRET || "default-secret-change-me"], // Kunci untuk encrypt cookie
    sameSite: "lax", // Proteksi CSRF
    maxAge: 60 * 60 * 24 * 7, // Cookie berlaku 7 hari
    path: "/", // Cookie berlaku untuk semua path
  },
});

// 2. Ekspor fungsi-fungsi yang akan digunakan di rute lain
export const { getSession, commitSession, destroySession } = sessionStorage;
