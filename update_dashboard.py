import re

with open("src/app/pages/DashboardAdmin.tsx", "r") as f:
    content = f.read()

# 1. Background and Blobs
content = re.sub(
    r'<div className="min-h-screen w-full m-0 p-0 relative" style={{ background: \'#ffffff\', backgroundAttachment: \'fixed\' }}>',
    r'<div className="min-h-screen w-full m-0 p-0 relative bg-[#F4F8FF]">',
    content
)

content = re.sub(
    r'\{/\* Decorative background blobs \*/\}.*?</div>\n\n      \{/\* Mobile: floating menu button \*/\}',
    r'{/* Mobile: floating menu button */}',
    content,
    flags=re.DOTALL
)

# 2. Update Variants
variants_old = r'''  const variants = \{
    primary: \{
      iconBg: "bg-gradient-to-br from-\[#6c42f5\] to-\[#5b36cc\]",
      iconColor: "text-white",
      shadow: "shadow-\[0_8px_24px_rgba\(108,66,245,0\.3\)\]",
    \},
    secondary: \{
      iconBg: "bg-gradient-to-br from-\[#ff6b9d\] to-\[#d95a86\]",
      iconColor: "text-white",
      shadow: "shadow-\[0_8px_24px_rgba\(255,107,157,0\.3\)\]",
    \},
    tertiary: \{
      iconBg: "bg-gradient-to-br from-\[#ffd60a\] to-\[#d9b608\]",
      iconColor: "text-white",
      shadow: "shadow-\[0_8px_24px_rgba\(255,214,10,0\.3\)\]",
    \},
    warning: \{
      iconBg: "bg-gradient-to-br from-\[#ff9500\] to-\[#cc7700\]",
      iconColor: "text-white",
      shadow: "shadow-\[0_8px_24px_rgba\(255,149,0,0\.3\)\]",
    \}
  \};'''

variants_new = '''  const variants = {
    primary: {
      iconBg: "bg-[#C8B6E2]",
      iconColor: "text-[#4A3B69]",
      shadow: "",
    },
    secondary: {
      iconBg: "bg-[#B8E8C8]",
      iconColor: "text-[#2B593F]",
      shadow: "",
    },
    tertiary: {
      iconBg: "bg-[#FFE4B5]",
      iconColor: "text-[#8A6327]",
      shadow: "",
    },
    warning: {
      iconBg: "bg-[#FFB3C1]",
      iconColor: "text-[#8A2B3D]",
      shadow: "",
    }
  };'''

content = re.sub(variants_old, variants_new, content)

# 3. StatCard
statcard_old = r'''    return \(
      <div 
        onClick=\{onClick\}
        className="relative bg-white/75 backdrop-blur-16 border border-white/90 rounded-\[2rem\] p-6 overflow-hidden hover:shadow-\[0_8px_24px_-4px_rgba\(0,119,182,0\.2\)\] transition-all duration-200 cursor-pointer group"
      >
        <div className="relative">
          <div className=\{cn\(
            "flex h-12 w-12 items-center justify-center rounded-xl mb-4",
            style\.iconBg, style\.shadow
          \)\}>
            <Icon className=\{cn\("h-6 w-6", style\.iconColor\)\} />
          </div>
          <h3 className="text-3xl font-bold text-\[#00B4D8\] mb-1">
            \{loading \? "—" : \(typeof value === 'number' \? value\.toLocaleString\(\) : value\)\}
          </h3>
          <p className="text-sm text-\[#64748B\] font-medium">\{title\}</p>
          \{trend && \(
            <div className="inline-flex items-center gap-1\.5 mt-3 px-3 py-1\.5 rounded-lg bg-\[#90E0EF\]/50 text-xs font-semibold text-\[#00B4D8\]">
              <span>\{trend\.positive \? '\+' : ''\}\{trend\.value\}</span>
              <span className="text-\[#64748B\] font-normal">dari bulan lalu</span>
            </div>
          \)\}
        </div>
      </div>
    \);'''

statcard_new = '''    return (
      <div 
        onClick={onClick}
        className="relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      >
        <div className="relative">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl mb-4",
            style.iconBg, style.shadow
          )}>
            <Icon className={cn("h-6 w-6", style.iconColor)} />
          </div>
          <h3 className="text-3xl font-bold text-[#1A1A2E] mb-1">
            {loading ? "—" : (typeof value === 'number' ? value.toLocaleString() : value)}
          </h3>
          <p className="text-sm text-[#64748B] font-medium">{title}</p>
          {trend && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[#F4F8FF] text-xs font-semibold text-[#1A6FD4]">
              <span>{trend.positive ? '+' : ''}{trend.value}</span>
              <span className="text-[#64748B] font-normal">dari bulan lalu</span>
            </div>
          )}
        </div>
      </div>
    );'''

content = re.sub(statcard_old, statcard_new, content)

# 4. Header Section
header_old = r'''              \{/\* Header \*/\}
              <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
                \{/\* Left - Dashboard Admin Badge \*/\}
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-\[2rem\] bg-white/85 backdrop-blur-20 border border-white/95 shadow-\[0_8px_32px_-4px_rgba\(0,119,182,0\.1\)\]">
                  <Sparkles className="h-4 w-4 text-\[#00B4D8\]" />
                  <span className="text-sm font-semibold text-\[#00B4D8\]">Dashboard Admin</span>
                </div>

                <div className="cursor-pointer" onClick=\{handleProfileClick\}>
                  <ProfileHeader />
                </div>
              </div>'''

header_new = '''              {/* Header */}
              <div className="flex items-center justify-between mb-8 pt-16 lg:pt-6">
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard Admin</h1>
                </div>
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 text-[#64748B] hover:text-[#1A6FD4] transition-colors shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                  </button>
                  <div className="cursor-pointer" onClick={handleProfileClick}>
                    <ProfileHeader />
                  </div>
                </div>
              </div>'''
content = re.sub(header_old, header_new, content)

# 5. Welcome Section
welcome_old = r'''              \{/\* Welcome Section \*/\}
              <div className="mb-8 animate-slideIn">
                <div className="bg-white/85 backdrop-blur-20 border border-white/95 rounded-\[2\.5rem\] p-10 shadow-\[0_8px_32px_-4px_rgba\(0,119,182,0\.1\)\]">
                  <h1 className="text-3xl font-bold text-\[#00B4D8\] mb-3">
                    \{t\.welcome\}
                  </h1>
                  <p className="text-base text-\[#64748B\]">
                    \{t\.description\}
                  </p>
                </div>
              </div>'''

welcome_new = '''              {/* Welcome Section */}
              <div className="mb-8 animate-slideIn">
                <div className="bg-gradient-to-r from-[#0F4C8A] to-[#1A6FD4] rounded-2xl p-10 shadow-lg flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {t.welcome}
                    </h1>
                    <p className="text-blue-100 text-sm">
                      {t.description}
                    </p>
                  </div>
                </div>
              </div>'''
content = re.sub(welcome_old, welcome_new, content)

# 6. Activity Table wrapper
content = content.replace(
    '''              {/* Activity Table */}
              <div className="bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)] animate-slideIn">''',
    '''              {/* Activity Table */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-slideIn">'''
)

# 7. Colors replacements throughout the file
content = content.replace('text-[#00B4D8]', 'text-[#1A6FD4]')
content = content.replace('border-[#90E0EF]', 'border-gray-200')
content = content.replace('bg-[#0077B6]', 'bg-[#1A6FD4]')
content = content.replace('hover:bg-[#CAF0F8]', 'hover:bg-blue-50')
content = content.replace('text-[#0077B6]', 'text-[#1A6FD4]')
content = content.replace('focus:ring-[#CAF0F8]', 'focus:ring-blue-100')
content = content.replace('focus:ring-[#D4ECF0]', 'focus:ring-blue-100')

with open("src/app/pages/DashboardAdmin.tsx", "w") as f:
    f.write(content)

