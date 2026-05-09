import { Notification } from "../modals/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const getMyNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ user: req.user._id })
            .populate("workOrder", "title status")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Notification.countDocuments({ user: req.user._id }),
        Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);
    return res.status(200).json(new apiResponse(200, "Notifications Fetched Successfully", {
        notifications, total, unreadCount, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({ _id: notificationId, user: req.user._id });
    if (!notification) throw new apiError(404, "Notification not found");
    notification.isRead = true;
    await notification.save();
    return res.status(200).json(new apiResponse(200, "Notification Marked as Read", notification));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json(new apiResponse(200, "All Notifications Marked as Read", {}));
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: notificationId, user: req.user._id });
    if (!notification) throw new apiError(404, "Notification not found");
    return res.status(200).json(new apiResponse(200, "Notification Deleted Successfully", {}));
});

export { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification };
