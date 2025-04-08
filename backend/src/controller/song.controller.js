import { Song } from "../models/song.model.js";

export const getAllSongs = async (req, res, next) => {
  try {
    // -1 = Descending => newest -> oldest
    // 1 = Ascending => oldest -> newest
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    next(error);
  }
};

// Get song by ID
export const getSongById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    res.status(200).json(song);
  } catch (error) {
    console.error("Error in getSongById:", error);
    next(error);
  }
};

// Helper function to generate demo lyrics with timestamps
function generateDemoLyrics(title, artist) {
  // Format the title for use in lyrics
  const formattedTitle =
    title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

  // Generate a unique but consistent seed based on title and artist for variety
  const seed = (title.length * artist.length) % 5;

  // Create lyrics with timestamps (in seconds)
  let lyrics;

  switch (seed) {
    case 0:
      lyrics = [
        { time: 0, text: `[Intro]` },
        { time: 3, text: `Welcome to ${formattedTitle}` },
        { time: 8, text: `A journey through sound and rhythm` },
        { time: 12, text: `Let ${artist} take you away` },
        { time: 18, text: `Into a world of melody` },

        { time: 24, text: `[Verse 1]` },
        { time: 28, text: `${formattedTitle} is playing now` },
        { time: 32, text: `The melody takes me away` },
        { time: 38, text: `As ${artist} sings with passion` },
        { time: 44, text: `I feel the rhythm in my veins` },

        { time: 50, text: `[Chorus]` },
        { time: 54, text: `${formattedTitle}, ${formattedTitle}` },
        { time: 60, text: `The song that moves my soul` },
        { time: 66, text: `${formattedTitle}, ${formattedTitle}` },
        { time: 72, text: `It makes me feel whole` },

        { time: 78, text: `[Verse 2]` },
        { time: 82, text: `The beats drop and time stands still` },
        { time: 88, text: `Every note perfectly placed` },
        { time: 94, text: `${artist}'s voice echoes in my mind` },
        { time: 100, text: `Creating memories that can't be erased` },

        { time: 106, text: `[Chorus]` },
        { time: 110, text: `${formattedTitle}, ${formattedTitle}` },
        { time: 116, text: `The song that moves my soul` },
        { time: 122, text: `${formattedTitle}, ${formattedTitle}` },
        { time: 128, text: `It makes me feel whole` },

        { time: 134, text: `[Bridge]` },
        { time: 138, text: `Music connects us all` },
        { time: 144, text: `Through highs and lows` },
        { time: 150, text: `${artist} understands this` },
        { time: 156, text: `And the feeling shows` },

        { time: 164, text: `[Outro]` },
        { time: 168, text: `${formattedTitle}...` },
      ];
      break;

    case 1:
      lyrics = [
        { time: 0, text: `[Intro]` },
        { time: 4, text: `Here we go now with ${formattedTitle}` },
        { time: 9, text: `Let the music speak to your heart` },
        { time: 14, text: `${artist} brings the energy tonight` },

        { time: 20, text: `[Verse 1]` },
        { time: 24, text: `Dawn breaks on a brand new day` },
        { time: 30, text: `${formattedTitle} playing in my head` },
        { time: 36, text: `${artist} crafted these words so carefully` },
        { time: 42, text: `Spinning stories never read` },

        { time: 48, text: `[Pre-Chorus]` },
        { time: 52, text: `And now I understand` },
        { time: 56, text: `What this feeling means` },
        { time: 60, text: `${formattedTitle} shows the way` },

        { time: 66, text: `[Chorus]` },
        { time: 70, text: `This is ${formattedTitle}` },
        { time: 74, text: `A moment frozen in time` },
        { time: 80, text: `Feel the music with ${artist}` },
        { time: 86, text: `Let it become sublime` },

        { time: 92, text: `[Verse 2]` },
        { time: 96, text: `Memories flash like photographs` },
        { time: 102, text: `${artist} paints with sound and light` },
        { time: 108, text: `${formattedTitle} brings us together` },
        { time: 114, text: `Through the darkness of the night` },

        { time: 120, text: `[Chorus]` },
        { time: 124, text: `This is ${formattedTitle}` },
        { time: 128, text: `A moment frozen in time` },
        { time: 134, text: `Feel the music with ${artist}` },
        { time: 140, text: `Let it become sublime` },

        { time: 146, text: `[Outro]` },
        { time: 150, text: `${formattedTitle} fades away` },
        { time: 156, text: `But the feeling stays` },
      ];
      break;

    case 2:
      lyrics = [
        { time: 0, text: `[Verse 1]` },
        { time: 4, text: `In the quiet moments when all is still` },
        { time: 10, text: `I hear ${formattedTitle} calling to me` },
        { time: 16, text: `${artist} knows exactly what to say` },
        { time: 22, text: `Words that set emotions free` },

        { time: 28, text: `[Chorus]` },
        { time: 32, text: `So I'll listen to ${formattedTitle}` },
        { time: 38, text: `Let it wash over me like rain` },
        { time: 44, text: `${artist}'s melodies are healing` },
        { time: 50, text: `Taking away all the pain` },

        { time: 56, text: `[Verse 2]` },
        { time: 60, text: `Rhythms pulse like heartbeats` },
        { time: 66, text: `Creating patterns in the air` },
        { time: 72, text: `${formattedTitle} becomes an anthem` },
        { time: 78, text: `For moments that we share` },

        { time: 84, text: `[Chorus]` },
        { time: 88, text: `So I'll listen to ${formattedTitle}` },
        { time: 94, text: `Let it wash over me like rain` },
        { time: 100, text: `${artist}'s melodies are healing` },
        { time: 106, text: `Taking away all the pain` },

        { time: 112, text: `[Bridge]` },
        { time: 116, text: `The world could end tomorrow` },
        { time: 122, text: `But tonight we have this song` },
        { time: 128, text: `${formattedTitle} keeps us going` },
        { time: 134, text: `When everything goes wrong` },

        { time: 140, text: `[Outro]` },
        { time: 144, text: `Thank you, ${artist}` },
        { time: 150, text: `For giving us ${formattedTitle}` },
      ];
      break;

    case 3:
      lyrics = [
        { time: 0, text: `[Intro]` },
        { time: 5, text: `${formattedTitle}...` },
        { time: 10, text: `The story begins now` },

        { time: 15, text: `[Verse 1]` },
        { time: 20, text: `Walking through the city lights` },
        { time: 26, text: `Headphones in, world tuned out` },
        { time: 32, text: `${formattedTitle} playing loud` },
        { time: 38, text: `${artist} speaking truths without a doubt` },

        { time: 44, text: `[Pre-Chorus]` },
        { time: 48, text: `And suddenly everything makes sense` },
        { time: 54, text: `Like ${artist} wrote it just for me` },

        { time: 60, text: `[Chorus]` },
        { time: 64, text: `${formattedTitle} becomes the soundtrack` },
        { time: 70, text: `To the movie of my life` },
        { time: 76, text: `${artist} crafts the perfect scene` },
        { time: 82, text: `Through moments of joy and strife` },

        { time: 88, text: `[Verse 2]` },
        { time: 92, text: `Strangers passing, unaware` },
        { time: 98, text: `That my world is filled with sound` },
        { time: 104, text: `${formattedTitle} in my bloodstream` },
        { time: 110, text: `${artist}'s melodies all around` },

        { time: 116, text: `[Chorus]` },
        { time: 120, text: `${formattedTitle} becomes the soundtrack` },
        { time: 126, text: `To the movie of my life` },
        { time: 132, text: `${artist} crafts the perfect scene` },
        { time: 138, text: `Through moments of joy and strife` },

        { time: 144, text: `[Outro]` },
        { time: 148, text: `Until the last note fades away` },
        { time: 154, text: `We'll always have ${formattedTitle}` },
      ];
      break;

    default:
      lyrics = [
        { time: 0, text: `[Verse 1]` },
        { time: 5, text: `Lost in the music of ${formattedTitle}` },
        { time: 11, text: `Words and melodies intertwine` },
        { time: 17, text: `${artist} creates a masterpiece` },
        { time: 23, text: `That transcends space and time` },

        { time: 29, text: `[Chorus]` },
        { time: 33, text: `We're all connected through ${formattedTitle}` },
        { time: 39, text: `A universal language we share` },
        { time: 45, text: `${artist} speaks to our hearts` },
        { time: 51, text: `With messages beyond compare` },

        { time: 57, text: `[Verse 2]` },
        { time: 61, text: `Each note like a droplet of rain` },
        { time: 67, text: `Creating ripples in the pond` },
        { time: 73, text: `${formattedTitle} awakens memories` },
        { time: 79, text: `Of moments now long gone` },

        { time: 85, text: `[Chorus]` },
        { time: 89, text: `We're all connected through ${formattedTitle}` },
        { time: 95, text: `A universal language we share` },
        { time: 101, text: `${artist} speaks to our hearts` },
        { time: 107, text: `With messages beyond compare` },

        { time: 113, text: `[Bridge]` },
        { time: 117, text: `When words fail, music speaks` },
        { time: 123, text: `${formattedTitle} says it all` },
        { time: 129, text: `${artist} understands` },
        { time: 135, text: `The rise and the fall` },

        { time: 141, text: `[Outro]` },
        { time: 145, text: `${formattedTitle} echoes in eternity` },
        { time: 151, text: `Forever in our hearts it will be` },
      ];
  }

  return lyrics;
}

// Get song lyrics
export const getSongLyrics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    // In a real app, you'd fetch lyrics from a database or external API
    // For demo purposes, we'll generate placeholder lyrics based on the song title
    let lyricsData = generateDemoLyrics(song.title, song.artist);

    // Scale timestamps to match song duration
    if (song.duration) {
      // Find the longest timestamp in the lyrics
      const maxTime = Math.max(...lyricsData.map((line) => line.time));

      // If we have a song duration and lyrics timestamps, scale them to fit the song
      if (maxTime > 0) {
        // Leave a buffer at the end of the song without lyrics (20% of the song length)
        const scaleFactor = (song.duration * 0.8) / maxTime;

        // Scale all timestamps
        lyricsData = lyricsData.map((line) => ({
          time: Math.round(line.time * scaleFactor),
          text: line.text,
        }));
      }
    }

    res.status(200).json({ lyrics: lyricsData });
  } catch (error) {
    console.error("Error in getSongLyrics:", error);
    next(error);
  }
};

// Search songs by query
export const searchSongs = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Create a regex for case-insensitive partial matching
    const searchRegex = new RegExp(q.trim(), "i");

    // Search in title, artist, and album fields
    const songs = await Song.find({
      $or: [{ title: searchRegex }, { artist: searchRegex }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(songs);
  } catch (error) {
    console.log("Error in searchSongs:", error);
    next(error);
  }
};

export const getFeaturedSongs = async (req, res, next) => {
  try {
    // fetch 6 random songs using mongodb's aggregation pipeline
    const songs = await Song.aggregate([
      {
        $sample: { size: 6 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

// Get songs by mood
export const getSongsByMood = async (req, res, next) => {
  try {
    const { mood } = req.params;

    // Validate mood
    const validMoods = [
      "happy",
      "sad",
      "energetic",
      "focus",
      "heartbreak",
      "relax",
      "love",
      "feel_good",
      "party",
      "chill",
    ];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({ message: "Invalid mood" });
    }

    // Get songs by mood or all moods if no mood is specified
    let songs;
    if (mood) {
      songs = await Song.find({ mood }).sort({ createdAt: -1 }).limit(20);
    } else {
      // Group songs by mood and get up to 8 songs for each mood
      const songsByMood = {};

      // Get all moods with songs
      const moodsWithSongs = await Song.distinct("mood");

      // Get 8 songs for each mood with songs
      for (const mood of moodsWithSongs) {
        songsByMood[mood] = await Song.find({ mood })
          .sort({ createdAt: -1 })
          .limit(8);
      }

      return res.status(200).json(songsByMood);
    }

    res.status(200).json(songs);
  } catch (error) {
    console.log("Error in getSongsByMood:", error);
    next(error);
  }
};

// Get all available moods
export const getMoods = async (req, res, next) => {
  try {
    // Map of all available moods with their user-friendly labels
    const moodLabels = {
      happy: "Happy",
      sad: "Sad",
      energetic: "Energetic",
      focus: "Focus",
      heartbreak: "Heartbreak",
      relax: "Relax",
      love: "Love",
      feel_good: "Feel Good",
      party: "Party",
      chill: "Chill",
    };

    // Always return all predefined moods, even if no songs use them yet
    const moodsWithLabels = Object.entries(moodLabels).map(
      ([value, label]) => ({
        value,
        label,
      })
    );

    res.status(200).json(moodsWithLabels);
  } catch (error) {
    console.log("Error in getMoods:", error);
    next(error);
  }
};
