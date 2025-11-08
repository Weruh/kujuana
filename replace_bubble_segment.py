from pathlib import Path
path = Path('frontend/src/pages/MatchConversation.jsx')
text = path.read_text()
def norm(value):
    return value.replace('\n', '\r\n')
old_segment = """                <div key={item.id} className={`flex items-start gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}\n                  <p className={`w-20 text-[13px] font-semibold leading-tight ${senderTone} ${isMine ? 'text-right' : 'text-left'}`}>\n                    {senderLabel}\n                  </p>\n                  <div\n                    className={`relative max-w-[82%] break-words rounded-[1.25rem] border px-4 py-3 text-[15px] leading-snug shadow-sm ${\n                      isMine\n                        ? 'rounded-br-md border-[#b9e5c1] bg-[#d9fdd3] text-[#1f2528]'\n                        : 'rounded-bl-md border-[#e4e4e4] bg-white text-[#1f2c34]'\n                    }`}\n                  >\n"""
old_segment = norm(old_segment)
if old_segment not in text:
    raise SystemExit('old bubble segment not found')
new_segment = """                <div key={item.id} className=\"flex flex-col\">\n                  <div\n                    className={`relative max-w-[85%] break-words rounded-[1.5rem] border px-4 py-3 text-[15px] leading-snug shadow-sm ${\n                      isMine\n                        ? 'ml-auto rounded-br-md border-[#b6deb6] bg-[#d9fdd3] text-[#1f2528]'\n                        : 'mr-auto rounded-bl-md border-[#ebe9e4] bg-white text-[#1f2c34]'\n                    }`}\n                  >\n                    {isMine ? (\n                      <div className=\"mb-2 flex items-center gap-2 text-[12px] font-semibold text-[#1b73e8]\">\n                        <span className=\"inline-flex border-l-4 border-[#1b73e8] pl-2 leading-tight\">{senderLabel}</span>\n                      </div>\n                    ) : null}\n"""
new_segment = norm(new_segment)
text = text.replace(old_segment, new_segment, 1)
path.write_text(text)
