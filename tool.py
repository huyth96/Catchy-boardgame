import re

# Giả sử bạn lưu code gốc vào biến original_code (dạng chuỗi lớn)
with open("card.html", "r", encoding="utf-8") as f:
    original_code = f.read()

# List slug cũ và slug mới theo đúng thứ tự thẻ của bạn!
old_slugs = [
    'function-cards', 'attack-cat', 'chill-cat', 'confused-cat', 'double-trouble', 'joker-cat', 'mirror', 'point-block', 'point-steal', 'reverse', 'shield', 'skip', 'sleepy-cat', 'wild-dare',
    'book', 'cat', 'friend', 'happy', 'mother', 'run', 'school', 'water',
    'break-a-leg'
]
new_slugs = [
    'Function:Function_Cards', 'Function:Attack_Cat', 'Function:Chill_Cat', 'Function:Confused_Cat', 'Function:Double_Trouble', 'Function:Joker_Cat', 'Function:Mirror', 'Function:Point_Block', 'Function:Point_Steal', 'Function:Reverse', 'Function:Shield', 'Function:Skip', 'Function:Sleepy_Cat', 'Function:Wild_Dare',
    'Vocab:A1:Book', 'Vocab:A1:Cat', 'Vocab:A1:Friend', 'Vocab:A1:Happy', 'Vocab:A1:Mother', 'Vocab:A1:Run', 'Vocab:A1:School', 'Vocab:A1:Water',
    'Idiom:Break_a_leg'
]

def replace_slug_lines(text, old_slugs, new_slugs):
    slug_idx = 0

    def replacer(match):
        nonlocal slug_idx
        result = f"slug: '{new_slugs[slug_idx]}'"
        slug_idx += 1
        return result

    # Chỉ replace đúng dòng slug cũ (theo thứ tự xuất hiện)
    new_code = re.sub(r"slug: '([^']+)'", replacer, text)
    return new_code

new_code = replace_slug_lines(original_code, old_slugs, new_slugs)

# Ghi ra file mới
with open("file_giu_nguyen_dong.js", "w", encoding="utf-8") as f:
    f.write(new_code)
