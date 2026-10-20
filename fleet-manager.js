/**
 * MÓDULO DE GERENCIAMENTO DA FROTA - REORDENAÇÃO DRAG & DROP E CONTROLE DE PERMISSÕES
 * 1ª CIA DO 1º BPTRAN
 */

// 1. Controle de Permissões de Inspeção Fotográfica
async function triggerPhotoUploadSecure(slotId, isAdminAuthenticated, requestAdminPassword, openBilaoModal, fileInput) {
    if (!isAdminAuthenticated) {
        const ok = await requestAdminPassword("adicionar ou alterar fotos da viatura");
        if (!ok) {
            if (typeof openBilaoModal === 'function') openBilaoModal();
            return false;
        }
    }
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
    }
    return true;
}

async function deleteInspectionPhotoSecure(currentVehicle, slotId, vehiclePhotos, isAdminAuthenticated, requestAdminPassword, openBilaoModal, callback) {
    if (!currentVehicle || !vehiclePhotos[currentVehicle]) return false;
    if (!isAdminAuthenticated) {
        const ok = await requestAdminPassword("excluir foto de inspeção da viatura");
        if (!ok) {
            if (typeof openBilaoModal === 'function') openBilaoModal();
            return false;
        }
    }
    delete vehiclePhotos[currentVehicle][slotId];
    if (typeof callback === 'function') callback();
    return true;
}

// 2. Drag & Drop Reordering Logic for Vehicle Sequence
function reorderVehicleSequence(customVehicles, draggedIndex, targetIndex) {
    if (!Array.isArray(customVehicles)) return customVehicles;
    if (draggedIndex < 0 || draggedIndex >= customVehicles.length) return customVehicles;
    if (targetIndex < 0 || targetIndex >= customVehicles.length) return customVehicles;
    if (draggedIndex === targetIndex) return customVehicles;

    const movedItem = customVehicles.splice(draggedIndex, 1)[0];
    customVehicles.splice(targetIndex, 0, movedItem);
    return customVehicles;
}

function moveVehicleStep(customVehicles, currentIndex, direction) {
    const targetIndex = currentIndex + direction;
    return reorderVehicleSequence(customVehicles, currentIndex, targetIndex);
}

function sortVehiclesDefault(customVehicles) {
    if (!Array.isArray(customVehicles)) return customVehicles;
    return customVehicles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        triggerPhotoUploadSecure,
        deleteInspectionPhotoSecure,
        reorderVehicleSequence,
        moveVehicleStep,
        sortVehiclesDefault
    };
}
