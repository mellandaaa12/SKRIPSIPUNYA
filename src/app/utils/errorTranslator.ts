/**
 * Utility to translate default system error messages (Supabase, Postgres, Network) 
 * into clean, user-friendly Indonesian.
 */
export function translateError(message?: string): string {
  if (!message) return "Terjadi kesalahan sistem. Silakan coba lagi.";
  
  const msg = message.toLowerCase();
  
  // Supabase Auth Errors
  if (msg.includes("invalid login credentials") || msg.includes("invalid username or password")) {
    return "Username atau password salah. Silakan periksa kembali.";
  }
  if (msg.includes("email not confirmed") || msg.includes("email not verified")) {
    return "Email Anda belum dikonfirmasi. Silakan periksa inbox email Anda.";
  }
  if (msg.includes("user not found") || msg.includes("account not found")) {
    return "Akun tidak ditemukan. Silakan hubungi administrator.";
  }
  if (msg.includes("user already registered") || msg.includes("user already exists") || msg.includes("already registered")) {
    return "Email atau username sudah terdaftar. Silakan gunakan yang lain.";
  }
  if (msg.includes("weak password")) {
    return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi.";
  }
  
  // Connection / Network Errors
  if (msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("networkrequestfailed")) {
    return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
  }
  if (msg.includes("timeout") || msg.includes("request timeout")) {
    return "Koneksi terputus karena batas waktu habis. Silakan coba lagi.";
  }
  
  // Database / Postgres Errors
  if (msg.includes("violates unique constraint") || msg.includes("duplicate key")) {
    return "Data ini sudah ada dalam sistem (duplikat).";
  }
  if (msg.includes("violates foreign key constraint") || msg.includes("foreign key")) {
    return "Data terkait tidak ditemukan atau melanggar relasi data.";
  }
  if (msg.includes("unauthorized") || msg.includes("jwt expired") || msg.includes("token expired")) {
    return "Sesi Anda telah berakhir. Silakan keluar dan masuk kembali.";
  }
  if (msg.includes("permission denied")) {
    return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  }

  // Fallback if not matched but clean up a bit
  return message;
}
