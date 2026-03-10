import { UserModel } from '#models/user.model.js'

const findOneByEmail = async ({ email, lean = true }) => {
	return await UserModel.findOne({ usr_email: email }).lean(lean).exec()
}

const getNextUserId = async () => {
	const latestUser = await UserModel.findOne({}, { usr_id: 1 }).sort({ usr_id: -1 }).lean().exec()
	return latestUser ? latestUser.usr_id + 1 : 1
}

const createUser = async ({
	usr_id,
	usr_slug,
	usr_name,
	usr_email,
	usr_status = 'pending',
}) => {
	return await UserModel.create({
		usr_id,
		usr_slug,
		usr_name,
		usr_email,
		usr_status,
	})
}

const updateStatusByEmail = async ({ email, status }) => {
	return await UserModel.findOneAndUpdate(
		{ usr_email: email },
		{ $set: { usr_status: status } },
		{ new: true }
	)
		.lean()
		.exec()
}

export const UserRepo = {
	findOneByEmail,
	getNextUserId,
	createUser,
	updateStatusByEmail,
}
