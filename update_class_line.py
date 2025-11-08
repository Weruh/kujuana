from pathlib import Path
lines = Path('frontend/src/pages/MatchConversation.jsx').read_text().splitlines()
idx = next(i for i,line in enumerate(lines) if "className={`relative max-w" in line)
lines[idx] = "                    className={`relative max-w-[85%] break-words rounded-[1.5rem] border px-4 py-3 text-[15px] leading-snug shadow-sm ${"
lines[idx+4] = "                        ? 'ml-auto rounded-br-md border-[#b6deb6] bg-[#d9fdd3] text-[#1f2528]'"
lines[idx+6] = "                        : 'mr-auto rounded-bl-md border-[#ebe9e4] bg-white text-[#1f2c34]'"
Path('frontend/src/pages/MatchConversation.jsx').write_text('\r\n'.join(lines))
