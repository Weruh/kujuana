from pathlib import Path
path = Path('frontend/src/pages/MatchConversation.jsx')
text = path.read_text()
text = text.replace("rounded-br-md border-[#b7dd] bg-[#9d83d9] text-[#1f2528]", "rounded-br-md border-[#bbcbff] bg-[#ddccff] text-[#1f2528]", 1)
text = text.replace("rounded-bl-md border-[#dfe1dc] bg-white text-[#1f2c34]", "rounded-bl-md border-[#e4e4e4] bg-[#f5f5f5] text-[#1f2c34]", 1)
text = text.replace("border-b border-r border-[##5e4891] bg-[#dcf]", "border-b border-r border-[#bbcbff] bg-[#ddccff]", 1)
text = text.replace("border-b border-l border-[#dfe1dc] bg-white", "border-b border-l border-[#e4e4e4] bg-[#f5f5f5]", 1)
path.write_text(text)
