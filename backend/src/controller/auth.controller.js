import { User } from "../models/user.model.js";

export const authCallback = async (req, res, next) => {
	try {
		const { id, firstName, lastName, imageUrl, email } = req.body;

		if (!id) {
			return res.status(400).json({ message: "User ID is required" });
		}

		// check if user already exists
		let user = await User.findOne({ clerkId: id });

		if (!user) {
			// signup - create new user
			console.log(`Creating new user with ID: ${id} and email: ${email || 'not provided'}`);
			user = await User.create({
				clerkId: id,
				fullName: `${firstName || ""} ${lastName || ""}`.trim(),
				imageUrl,
				email: email || ""
			});
		} else {
			// update existing user if needed
			const needsUpdate = (
				(email && user.email !== email) ||
				(imageUrl && user.imageUrl !== imageUrl) ||
				(firstName && lastName && user.fullName !== `${firstName} ${lastName}`.trim())
			);

			if (needsUpdate) {
				console.log(`Updating existing user: ${id}`);
				user.fullName = `${firstName || ""} ${lastName || ""}`.trim() || user.fullName;
				user.imageUrl = imageUrl || user.imageUrl;
				user.email = email || user.email;
				await user.save();
			}
		}

		res.status(200).json({ success: true, user: { id: user._id, clerkId: user.clerkId } });
	} catch (error) {
		console.error("Error in auth callback:", error);
		res.status(500).json({ message: "Error processing authentication", error: error.message });
	}
};

export const checkAdminEmail = async (req, res, next) => {
	try {
		const { email } = req.body;
		
		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		const isAdmin = process.env.ADMIN_EMAIL === email;
		
		res.status(200).json({ isAdmin });
	} catch (error) {
		next(error);
	}
};