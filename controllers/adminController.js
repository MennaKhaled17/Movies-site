const usermodel = require('../models/Schema');


module.exports = {
    search_get: (req, res) => {
        console.log('a7a');
        const query = req.query.email; // Query from the search bar
        if (!query) {
            return res.redirect('/admin'); // Redirect if no query is provided
        }
        console.log(query);
    },

    deactivate_user: async (req, res) => {
        try {
            const idd = req.params._id;
            if (!mongoose.Types.ObjectId.isValid(idd)) {
                return res.status(400).json({ success: false, message: 'Invalid User ID' });
            }

            await usermodel.findByIdAndUpdate(idd, { active: false });
            res.json({ success: true, message: 'User deactivated successfully.' });
        } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'Failed to deactivate user.' });
        }
    },

    update_user: async (req, res) => {
        const { _id } = req.params;
        console.log("Received _id:", _id);  // Log the received _id

        const { firstname, lastname, country, phone, email, password } = req.body;

        try {
            const objectId = new mongoose.Types.ObjectId(_id);
            console.log("Querying with ObjectId:", objectId); // Log the ObjectId being queried

            // Fetch user by ObjectId
            const user = await usermodel.findById(objectId);
            if (!user) {
                console.log("User not found with ID:", _id);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            user.firstname = firstname || user.firstname;
            user.lastname = lastname || user.lastname;
            user.country = country || user.country;
            user.phone = phone || user.phone;
            user.email = email || user.email;
            user.password = password || user.password;

            const updatedUser = await user.save();  // Save the updated user
            res.json({ success: true, message: 'User updated successfully.', updatedUser });
        } catch (error) {
            console.error("Update failed:", error.message);
            res.status(500).json({ success: false, message: 'Failed to update user. Error: ' + error.message });
        }
    },

    admin_get: async (req, res) => {
        const searchQuery = req.query.email || '';
        try {
            const users = await usermodel.find({ 
                email: { $regex: new RegExp(searchQuery, 'i') } 
            });
            res.render('admin', { users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    
}