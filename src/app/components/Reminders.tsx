import svgPaths from "../../assets/svg-ued398lyyb";

export function Reminders() {
  // Empty state for new accounts
  const schedules: any[] = [];

  return (
    <div className="absolute left-[426px] top-[338px] w-[894px] h-[320px]">
      {/* Background */}
      <div className="absolute inset-0 bg-white rounded-[8px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
      
      {/* Title */}
      <p className="absolute left-[49.33px] top-[38px] font-['Poppins'] font-semibold text-[18px] text-[#121212] tracking-[0.3px] leading-[27px]">
        Jadwal Hari Ini
      </p>

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="absolute left-[49.33px] top-[77px] right-[49.33px] flex flex-col items-center justify-center py-[60px]">
          <svg className="w-[48px] h-[48px] mb-[12px] text-[#cbd5e1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-['Poppins'] text-[14px] text-[#94a3b8] text-center">
            Belum ada jadwal untuk hari ini
          </p>
        </div>
      )}

      {/* Schedule Cards Container (will show when there's data) */}
      <div className="absolute left-[49.33px] top-[77px] w-[801.311px] flex flex-col gap-[8px]">
        {schedules.map((schedule, index) => (
          <div 
            key={index}
            className="relative w-full h-[70px] rounded-[12px] border"
            style={{ 
              backgroundColor: schedule.bgColor,
              borderColor: schedule.borderColor 
            }}
          >
            <div className="absolute left-[13px] top-[13px] flex items-start gap-[8px]">
              {/* Icon */}
              <div className="w-[16px] h-[16px] mt-[2px]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 16 16">
                  <path d={svgPaths.p1c949200} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={svgPaths.pd12ce00} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={svgPaths.p226ad00} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={svgPaths.p1e9aa900} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={svgPaths.p12fdd280} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={svgPaths.p3be7b040} stroke="#99A1AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="flex flex-col gap-[4px]">
                <p 
                  className="font-['Inter'] font-medium text-[16px] leading-[24px] tracking-[-0.3125px]"
                  style={{ color: schedule.textColor }}
                >
                  {schedule.title}
                </p>
                <div className="flex items-center gap-[4px] opacity-75">
                  <svg className="w-[12px] h-[12px]" fill="none" viewBox="0 0 12 12">
                    <path d="M6 3V6L8 7" stroke={schedule.textColor} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={svgPaths.p3e7757b0} stroke={schedule.textColor} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-['Inter'] text-[12px] leading-[16px]" style={{ color: schedule.textColor }}>
                    {schedule.time}
                  </span>
                  <span className="font-['Inter'] text-[12px] leading-[16px]" style={{ color: schedule.textColor }}>
                    • {schedule.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}