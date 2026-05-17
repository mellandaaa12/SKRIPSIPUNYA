export function TaskProgress() {
  // Empty state for new accounts
  const tasks: any[] = [];

  return (
    <div className="absolute left-[426px] top-[668px] w-[281px] h-[236px]">
      <div className="absolute inset-0 bg-white rounded-[8px] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
      
      {/* Title */}
      <p className="absolute left-[28px] top-[22px] font-['Poppins'] font-medium text-[15px] text-[#121212] tracking-[0.3px] leading-[23px]">
        Task Progress
      </p>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="absolute left-[28px] top-[65px] right-[28px] flex flex-col items-center justify-center py-[40px]">
          <p className="font-['Poppins'] text-[13px] text-[#94a3b8] text-center">
            Belum ada task progress
          </p>
        </div>
      )}

      {/* Task List (will show when there's data) */}
      {tasks.map((task, index) => (
        <div 
          key={index}
          className="absolute left-[28px] w-[225px] h-[35px]"
          style={{ top: `${65.24 + index * 52.76}px` }}
        >
          <p className="absolute left-0 top-0 font-['Poppins'] text-[12px] text-[#121212] tracking-[0.3px] leading-[21px]">
            {task.name}
          </p>
          <p className="absolute right-0 top-0 font-['Poppins'] text-[12px] text-[#121212] opacity-50 tracking-[0.3px] leading-[21px]">
            {task.completed}/{task.total}
          </p>
          <div className="absolute left-0 bottom-0 w-full h-[5px] bg-[#34a770] opacity-10 rounded-[200px]" />
          <div 
            className="absolute left-0 bottom-0 h-[5px] bg-[#46bd84] rounded-[200px]" 
            style={{ width: `${(task.completed / task.total) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}