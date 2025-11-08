from pathlib import Path
text = Path('frontend/src/pages/MatchConversation.jsx').read_text()
needle = "            <PhoneIcon className=\"h-5 w-5\" />"
pos = text.find(needle)
if pos == -1:
    raise SystemExit('phone icon not found')
end = text.find('          </button>', pos)
if end == -1:
    raise SystemExit('phone button closing not found')
print(repr(text[end:end+40]))
