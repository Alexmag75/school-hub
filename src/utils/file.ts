/**
 * ==============================================================================
 * UTILITY: File to Base64 Converter (`readAsBase64`)
 * ==============================================================================
 * @description Асинхронно зчитує обраний файл на клієнті (File) та конвертує його
 *              у рядок формату Base64 (Data URL).
 *
 * @usecase     Використовується для швидкого попереднього перегляду зображень (Instant Preview)
 *              у конструкторі уроків або аватарках до того, як файл буде завантажено на сервер.
 *
 * @param {File} file — Об'єкт файлу, отриманий з `<input type="file">` або Drag-and-Drop
 *
 * @returns {Promise<string>} Проміс, що повертає Base64-рядок (наприклад: `data:image/png;base64,iVBORw...`)
 * ==============================================================================
 */
export function readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Подія успішного завершення зчитування файлу
        reader.onload = (e) => resolve(e.target?.result as string);

        // Обробка помилки зчитування файлу
        reader.onerror = (err) => reject(err);

        // Запуск читання файлу у форматі Data URL (Base64)
        reader.readAsDataURL(file);
    });
}