import { Skill } from "../modals/Skill.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../modals/User.js";

const createSkill = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new apiError(400, "Name is required");
    }
    const skillExists = await Skill.findOne({ name });
    if (skillExists) {
        throw new apiError(400, "Skill already exists");
    }
    const skill = await Skill.create({
        name,
    })
    return res.status(200).json(
        new apiResponse(200, "Skill Created Successfully", skill)
    )
})

const getSkills = asyncHandler(async (req, res) => {
    const skills = await Skill.find();
    return res.status(200).json(
        new apiResponse(200, "Skills Fetched Successfully", skills)
    )
})

const getSkillById = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    if (!skillId) {
        throw new apiError(400, "Skill ID is required");
    }
    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new apiError(404, "Skill not found");
    }
    return res.status(200).json(
        new apiResponse(200, "Skill Fetched Successfully", skill)
    )
})

const updateSkill = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    const { name } = req.body;
    if (!skillId) {
        throw new apiError(400, "Skill ID is required");
    }
    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new apiError(404, "Skill not found");
    }
    skill.name = name;
    await skill.save();
    return res.status(200).json(
        new apiResponse(200, "Skill Updated Successfully", skill)
    )
})

const deleteSkill = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    if (!skillId) {
        throw new apiError(400, "Skill ID is required");
    }
    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new apiError(404, "Skill not found");
    }
    await skill.deleteOne();
    return res.status(200).json(
        new apiResponse(200, "Skill Deleted Successfully", skill)
    )
})

const assignSkillToWorker = asyncHandler(async (req, res) => {
    const { workerId, skillId } = req.body;
    if (!workerId || !skillId) {
        throw new apiError(400, "All fields are required");
    }
    const worker = await User.findById(workerId);
    if (!worker) {
        throw new apiError(404, "Worker not found");
    }
    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new apiError(404, "Skill not found");
    }
    worker.workerDetails.skills.push(skillId);
    await worker.save();
    return res.status(200).json(
        new apiResponse(200, "Skill Assigned Successfully", { worker, skill })
    )
})

export {
    createSkill,
    getSkills,
    getSkillById,
    updateSkill,
    deleteSkill
}