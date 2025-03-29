const express = require('express');
const router = express.Router();

const { createBranch, getAllBranches, getBranchById, updateBranch, deleteBranch } = require('../../controllers/SuperAdmin-Controllers/branchController');

// Branch Routes
router.post('/createBranch', createBranch);
router.get('/getAllBranches', getAllBranches);
router.get('/getBranchById/:id', getBranchById);
router.put('/updateBranch/:id', updateBranch);
router.delete('/deleteBranch/:id', deleteBranch);

module.exports = router;