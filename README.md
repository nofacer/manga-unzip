# Manga Unzipper

## Usage

```typescript
import MangaUnzipper from "manga-unzipper"

const unzipper = new MangaUnzipper();
unzipper.unzipManga('a.zip', '.') // this will get a.pdf in ./
//or
unzipper.unzipManga(['a.zip', 'b.zip'], '.') // this will get a.pdf and b.pdf in ./
```
