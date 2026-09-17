// Parses the admin form's plain-text lesson list ("제목|유튜브URL" per line)
// into structured rows. Kept simple deliberately — the admin UI is a single
// owner's internal tool, not a general-purpose CMS.
export function parseLessonLines(text: string): { title: string; youtubeUrl: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, youtubeUrl] = line.split("|").map((part) => part?.trim());
      return { title: title ?? "", youtubeUrl: youtubeUrl ?? "" };
    })
    .filter((lesson) => lesson.title && lesson.youtubeUrl);
}
