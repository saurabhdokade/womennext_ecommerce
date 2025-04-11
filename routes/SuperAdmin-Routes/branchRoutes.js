const express = require('express');
const router = express.Router();

const { createBranch, getAllBranches, getBranchById, updateBranch, deleteBranch, availableDeliveryBoys, availableProducts } = require('../../controllers/SuperAdmin-Controllers/branchController');

//✅ SuperAdmin Branch Routes
router.post('/createBranch', createBranch);
router.get('/getAllBranches', getAllBranches);
router.get('/getBranchById/:id', getBranchById);
router.put('/updateBranch/:id', updateBranch);
router.delete('/deleteBranch/:id', deleteBranch);
router.get('/availableDeliveryBoys', availableDeliveryBoys);
router.get('/availableProducts', availableProducts);

module.exports = router;