import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";

// helper function for cloudinary uploads with retry logic
const uploadToCloudinary = async (file, options = {}) => {
	const maxRetries = options.maxRetries || 3;
	let attempt = 0;
	let lastError = null;
	
	while (attempt < maxRetries) {
		try {
			console.log(`Uploading ${file.name} to Cloudinary (attempt ${attempt + 1}/${maxRetries})`);
			
			// Set resource_type to auto to handle different file types
			// Set timeout to 60 seconds for large files
			const result = await cloudinary.uploader.upload(file.tempFilePath, {
				resource_type: "auto",
				timeout: 60000,
				// Add folder structure based on file type
				folder: file.mimetype.startsWith('audio') ? 'audix/audio' : 'audix/images',
				// Use filename as public_id but remove extension and special chars
				public_id: file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_'),
			});
			
			console.log(`Successfully uploaded ${file.name} to Cloudinary`);
			return result.secure_url;
		} catch (error) {
			lastError = error;
			console.error(`Error uploading to Cloudinary (attempt ${attempt + 1}/${maxRetries}):`, error);
			
			// Wait before retrying (exponential backoff)
			const delay = 1000 * Math.pow(2, attempt);
			await new Promise(resolve => setTimeout(resolve, delay));
			
			attempt++;
		}
	}
	
	// If we've exhausted all retries, throw the last error
	throw new Error(`Failed to upload to Cloudinary after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

export const createSong = async (req, res, next) => {
	try {
		// Validate request
		if (!req.files || !req.files.audioFile || !req.files.imageFile) {
			return res.status(400).json({ message: "Please upload all files" });
		}

		const { title, artist, albumId, duration, mood } = req.body;
		
		// Validate required fields
		if (!title || !artist) {
			return res.status(400).json({ message: "Title and artist are required" });
		}
		
		const audioFile = req.files.audioFile;
		const imageFile = req.files.imageFile;
		
		// Validate file types
		if (!audioFile.mimetype.startsWith('audio/')) {
			return res.status(400).json({ message: "Invalid audio file format" });
		}
		
		if (!imageFile.mimetype.startsWith('image/')) {
			return res.status(400).json({ message: "Invalid image file format" });
		}
		
		// Log the upload process start
		console.log(`Starting upload for song: ${title} by ${artist}`);
		console.log(`Audio file: ${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(2)}MB)`);
		console.log(`Image file: ${imageFile.name} (${(imageFile.size / (1024 * 1024)).toFixed(2)}MB)`);

		// Upload files to Cloudinary in parallel for better performance
		const [audioUrl, imageUrl] = await Promise.all([
			uploadToCloudinary(audioFile, { maxRetries: 3 }),
			uploadToCloudinary(imageFile, { maxRetries: 3 })
		]);

		console.log(`Successfully uploaded files for song: ${title}`);
		console.log(`Audio URL: ${audioUrl}`);
		console.log(`Image URL: ${imageUrl}`);

		// Create and save the song
		const song = new Song({
			title,
			artist,
			audioUrl,
			imageUrl,
			duration,
			mood,
			albumId: albumId || null,
		});

		await song.save();
		console.log(`Saved song to database with ID: ${song._id}`);

		// if song belongs to an album, update the album's songs array
		if (albumId) {
			await Album.findByIdAndUpdate(albumId, {
				$push: { songs: song._id },
			});
			console.log(`Added song to album with ID: ${albumId}`);
		}
		
		// Return success response
		res.status(201).json({
			success: true,
			message: "Song created successfully",
			song
		});
	} catch (error) {
		console.error("Error in createSong:", error);
		
		// Send a more specific error message
		res.status(500).json({ 
			success: false, 
			message: "Failed to create song", 
			error: error.message 
		});
	}
};

export const deleteSong = async (req, res, next) => {
	try {
		const { id } = req.params;

		const song = await Song.findById(id);

		// if song belongs to an album, update the album's songs array
		if (song.albumId) {
			await Album.findByIdAndUpdate(song.albumId, {
				$pull: { songs: song._id },
			});
		}

		await Song.findByIdAndDelete(id);

		res.status(200).json({ message: "Song deleted successfully" });
	} catch (error) {
		console.log("Error in deleteSong", error);
		next(error);
	}
};

export const createAlbum = async (req, res, next) => {
	try {
		const { title, artist, releaseYear } = req.body;
		const { imageFile } = req.files;

		const imageUrl = await uploadToCloudinary(imageFile);

		const album = new Album({
			title,
			artist,
			imageUrl,
			releaseYear,
		});

		await album.save();

		res.status(201).json(album);
	} catch (error) {
		console.log("Error in createAlbum", error);
		next(error);
	}
};

export const deleteAlbum = async (req, res, next) => {
	try {
		const { id } = req.params;
		await Song.deleteMany({ albumId: id });
		await Album.findByIdAndDelete(id);
		res.status(200).json({ message: "Album deleted successfully" });
	} catch (error) {
		console.log("Error in deleteAlbum", error);
		next(error);
	}
};

export const checkAdmin = async (req, res, next) => {
	res.status(200).json({ admin: true });
};
