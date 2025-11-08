from pathlib import Path
path = Path('frontend/src/pages/MatchConversation.jsx')
lines = path.read_text().splitlines()
idx = next(i for i,line in enumerate(lines) if "className={`flex items-start gap-2" in line)
# remove <p> block (three lines following)
del lines[idx+1:idx+4]
lines[idx] = '                <div key={item.id} className="flex flex-col">'
lines[idx+2] = "                    className={`relative max-w-[85%] break-words rounded-[1.5rem] border px-4 py-3 text-[15px] leading-snug shadow-sm ${"
lines[idx+4] = "                        ? 'ml-auto rounded-br-md border-[#b6deb6] bg-[#d9fdd3] text-[#1f2528]'"
lines[idx+5] = "                        : 'mr-auto rounded-bl-md border-[#ebe9e4] bg-white text-[#1f2c34]'"
lines[idx+6] = "                    }` }"  # ???
