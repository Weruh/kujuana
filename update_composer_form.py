from pathlib import Path
path = Path('frontend/src/pages/MatchConversation.jsx')
text = path.read_text()
old = '      <form onSubmit={handleSend} className="border-t border-[#d1d7db] bg-[#f0f2f5] px-5 py-4">'
new = '      <form onSubmit={handleSend} className="border-t border-[#dcdcdc] bg-[#f0f2f5] px-4 py-3 sm:px-6">'
if old not in text:
    raise SystemExit('composer form line not found')
text = text.replace(old, new, 1)
path.write_text(text)
