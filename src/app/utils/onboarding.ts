import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../../styles/onboarding.css";

export const startOnboarding = (navigate?: (path: string) => void) => {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0, 0, 0, 0.75)",
    allowClose: false,
    nextBtnText: "Selanjutnya",
    prevBtnText: "Kembali",
    doneBtnText: "Mengerti",
    steps: [
      {
        element: "#onboarding-welcome",
        popover: {
          title: "Selamat Datang! 👋",
          description: "Halo! Selamat datang di media pembelajaran Informatika. Panduan ini akan membantu kamu memahami fitur-fitur utama yang tersedia.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#onboarding-sidebar",
        popover: {
          title: "Menu Navigasi 导航",
          description: "Di sini kamu bisa berpindah halaman untuk mengakses materi, forum, dan jadwal pelajaran.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#onboarding-welcome-card",
        popover: {
          title: "Informasi Profil & Streak 🔥",
          description: "Pantau profilmu, jumlah streak harian, dan poin bantuan (hint) yang kamu miliki di sini.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#onboarding-streak-card",
        popover: {
          title: "Check-in Harian 📅",
          description: "Jangan lupa untuk check-in setiap hari untuk menjaga streak dan mendapatkan poin bantuan tambahan!",
          side: "left",
          align: "center",
        },
      },
      {
        element: "#onboarding-menu-pembelajaran",
        popover: {
          title: "Menu Pembelajaran 📚",
          description: "Klik di sini untuk melihat semua materi pembelajaran yang tersedia. Mari kita lihat isinya!",
          side: "right",
          align: "center",
        },
        onNextClick: () => {
          if (navigate) navigate("/pembelajaran");
          setTimeout(() => driverObj.moveNext(), 500);
        }
      },
      {
        element: "#onboarding-pembelajaran-search",
        popover: {
          title: "Cari Materi 🔍",
          description: "Kamu bisa mencari materi tertentu dengan cepat menggunakan kotak pencarian ini.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#onboarding-pembelajaran-grid",
        popover: {
          title: "Daftar Materi 📖",
          description: "Pilih salah satu materi untuk mulai belajar. Di setiap kartu materi, kamu bisa melihat progress penyelesaianmu.",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#onboarding-menu-schedule",
        popover: {
          title: "Menu Jadwal 🗓️",
          description: "Sekarang mari kita lihat jadwal pelajaran mingguanmu.",
          side: "right",
          align: "center",
        },
        onNextClick: () => {
          if (navigate) navigate("/schedule");
          setTimeout(() => driverObj.moveNext(), 500);
        }
      },
      {
        element: "#onboarding-schedule-tabs",
        popover: {
          title: "Pilih Hari 📆",
          description: "Klik pada nama hari untuk melihat jadwal mata pelajaran di hari tersebut.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#onboarding-profile-header",
        popover: {
          title: "Menu Profil 👤",
          description: "Klik di sini untuk melihat detail akunmu atau memperbarui foto profil.",
          side: "bottom",
          align: "end",
        },
      },
      {
        popover: {
          title: "Panduan Selesai! 🚀",
          description: "Sekarang kamu sudah siap untuk mulai belajar. Jika lupa, kamu bisa mengulang panduan ini kapan saja melalui menu di sidebar. Selamat belajar dan semoga sukses!",
        },
      },
    ] as any,
    onDestroyed: () => {
      localStorage.setItem("onboarding_siswa_done", "true");
    },
  });

  driverObj.drive();
};

export const resetOnboarding = (navigate?: (path: string) => void) => {
  localStorage.removeItem("onboarding_siswa_done");
  if (navigate) navigate("/dashboard");
  setTimeout(() => startOnboarding(navigate), 500);
};
