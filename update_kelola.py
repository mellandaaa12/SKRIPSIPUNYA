import re

with open("src/app/pages/KelolaKelas.tsx", "r") as f:
    content = f.read()

# 1. Background
content = re.sub(
    r'<div className="min-h-screen w-full relative" style={{ background: \'#ffffff\', backgroundAttachment: \'fixed\' }}>',
    r'<div className="min-h-screen w-full relative bg-[#F4F8FF]">',
    content
)

content = re.sub(
    r'\{/\* Background blobs \*/\}.*?</div>\n\n      \{/\* Mobile Menu Btn \*/\}',
    r'{/* Mobile Menu Btn */}',
    content,
    flags=re.DOTALL
)

# 2. Colors and Buttons
content = content.replace('bg-[#0077B6]', 'bg-[#1A6FD4]')
content = content.replace('text-[#00B4D8]', 'text-[#1A1A2E]')
content = content.replace('text-[#0077B6]', 'text-[#1A6FD4]')
content = content.replace('bg-white/85 backdrop-blur-20 border border-white/95 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.1)]', 'bg-white rounded-2xl border border-gray-100 shadow-sm')
content = content.replace('bg-white/85 backdrop-blur-16 border border-white/95 rounded-[2rem] p-4 mb-6 shadow-[0_8px_32px_-4px_rgba(86,182,198,0.05)]', 'bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm')

# 3. Class Cards Themes
themes_old = r'''                      const themes = \[
                        \{
                          bg: "bg-\[#0077B6\]",
                          text: "text-white/80",
                          chip: "bg-white/20 text-white",
                          title: "text-white"
                        \},
                        \{
                          bg: "bg-\[#00B4D8\]",
                          text: "text-white/80",
                          chip: "bg-white/20 text-white",
                          title: "text-white"
                        \},
                        \{
                          bg: "bg-\[#90E0EF\]",
                          text: "text-\[#0077B6\]/80",
                          chip: "bg-\[#0077B6\]/10 text-\[#0077B6\]",
                          title: "text-\[#0077B6\]"
                        \},
                        \{
                          bg: "bg-\[#CAF0F8\]",
                          text: "text-\[#0077B6\]/80",
                          chip: "bg-\[#0077B6\]/10 text-\[#0077B6\]",
                          title: "text-\[#0077B6\]"
                        \}
                      \];'''

themes_new = '''                      const themes = [
                        {
                          bg: "bg-[#C8B6E2]",
                          text: "text-[#4A3B69]",
                          chip: "bg-white/40 text-[#4A3B69]",
                          title: "text-[#1A1A2E]"
                        },
                        {
                          bg: "bg-[#B8E8C8]",
                          text: "text-[#2B593F]",
                          chip: "bg-white/40 text-[#2B593F]",
                          title: "text-[#1A1A2E]"
                        },
                        {
                          bg: "bg-[#FFE4B5]",
                          text: "text-[#8A6327]",
                          chip: "bg-white/40 text-[#8A6327]",
                          title: "text-[#1A1A2E]"
                        },
                        {
                          bg: "bg-[#FFB3C1]",
                          text: "text-[#8A2B3D]",
                          chip: "bg-white/40 text-[#8A2B3D]",
                          title: "text-[#1A1A2E]"
                        },
                        {
                          bg: "bg-[#B5D4F4]",
                          text: "text-[#1A6FD4]",
                          chip: "bg-white/40 text-[#1A6FD4]",
                          title: "text-[#1A1A2E]"
                        }
                      ];'''
content = re.sub(themes_old, themes_new, content)

# 4. Fix themes idx modulus
content = content.replace('const theme = themes[idx % 4];', 'const theme = themes[idx % 5];')

# 5. Card Styling
card_old = r'''                            \{/\* Upper colored section representing the folder contents body \*/\}
                            <div className=\{`\$\{theme\.bg\} rounded-b-\[2rem\] rounded-tr-\[2rem\] rounded-tl-lg p-6 flex flex-col justify-between flex-1 min-h-\[160px\] relative z-10 shadow-\[inset_0_1px_1px_rgba\(255,255,255,0\.2\)\]`\}>'''
card_new = '''                            {/* Upper colored section representing the folder contents body */}
                            <div className={`${theme.bg} rounded-b-[2rem] rounded-tr-[2rem] rounded-tl-lg p-6 flex flex-col justify-between flex-1 min-h-[160px] relative z-10`}>'''
content = re.sub(card_old, card_new, content)

# Bottom explore section
explore_old = r'''                            \{/\* Bottom Explore Section \*/\}
                            <div className="pt-3 px-4 pb-1 flex items-center justify-between relative z-10">
                              <span className="font-bold text-sm text-\[#1A1A2E\]">
                                Explore
                              </span>
                              <div className="w-10 h-10 rounded-2xl bg-gray-50 group-hover:bg-\[#1A6FD4\] group-hover:text-white text-\[#1A1A2E\] flex items-center justify-center transition-all duration-200">
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0\.5 transition-transform" />
                              </div>
                            </div>'''
explore_new = '''                            {/* Bottom Explore Section */}
                            <div className="pt-3 px-4 pb-1 flex items-center justify-between relative z-10">
                              <span className="font-bold text-sm text-[#1A6FD4]">
                                Detail Kelas
                              </span>
                              <div className="w-10 h-10 rounded-2xl bg-[#F4F8FF] group-hover:bg-[#1A6FD4] group-hover:text-white text-[#1A6FD4] flex items-center justify-center transition-all duration-200">
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>'''
content = re.sub(explore_old, explore_new, content)

with open("src/app/pages/KelolaKelas.tsx", "w") as f:
    f.write(content)
