const getFileName = (originalName, req) => {
    const ext = originalName.substr(originalName.lastIndexOf('.') + 1)

    // Get date
    const d = new Date();
    const date = [d.getFullYear(), d.getMonth().toString().padStart(2, 0), d.getDate().toString().padStart(2, 0)].join('')
    const time = [d.getHours().toString().padStart(2, 0), d.getMinutes().toString().padStart(2, 0), d.getSeconds().toString().padStart(2, 0)].join('')

    // New File Name
    return [req.user.accountNumber, date, time].join("_").concat(".", ext)
}

module.exports = { getFileName }