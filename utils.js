export function trimTitle(title, maxLength = 70) {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength - 3).trim() + '...';
}