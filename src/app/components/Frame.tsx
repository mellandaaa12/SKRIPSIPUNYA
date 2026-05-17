import { useAuth } from "../context/AuthContext";

export function Frame() {
  const { user } = useAuth();
  
  return (
    <div className="absolute left-[426px] top-[120px] w-[894px] h-[202px] bg-[#1294f2] rounded-[35px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center pl-[50px]">
      <div className="flex flex-col text-white">
        <p className="font-['Lato'] font-extrabold text-[40px] uppercase tracking-[1.6px] leading-[1.4]">
          Selamat datang, {user?.name || "Student"}!
        </p>
        <p className="font-['Lato'] font-medium text-[20px] capitalize tracking-[0.8px] leading-[1.4]">
          Mulai belajar Hari Ini!!!
        </p>
      </div>
    </div>
  );
}