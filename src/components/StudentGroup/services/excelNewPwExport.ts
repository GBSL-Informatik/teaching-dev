import StudentGroup from '@tdev-models/StudentGroup';
import ExcelJS from 'exceljs';
import siteConfig from '@generated/docusaurus.config';
import saveAs from '@tdev-components/util/saveAs';
import User from '@tdev-models/User';
import generatePassword, { ALPHABET_SMALL } from '@tdev-components/util/generatePassword';

export async function exportNewPasswordList(
    group: StudentGroup,
    config: { pwLength: number; prefixLength: number }
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = siteConfig.title;
    workbook.lastModifiedBy = siteConfig.title;
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(group.name);

    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: group.students.length + 1, column: 4 }
    };

    const headerRow = sheet.insertRow(1, ['E-Mail', 'Passwort']);
    headerRow.eachCell((cell) => {
        cell.font = {
            bold: true
        };
    });

    const generateUserPassword = (user: User) => {
        if (config.prefixLength <= 1) {
            return generatePassword(config.pwLength, ALPHABET_SMALL);
        }
        const prefix = user.email.substring(0, config.prefixLength - 1);
        const randomSize = config.pwLength - config.prefixLength;
        const pw = `${prefix}-${generatePassword(randomSize, ALPHABET_SMALL)}`;
        return pw;
    };

    group.students.forEach((student, index) => {
        sheet.insertRow(index + 2, [student.email, generateUserPassword(student)]);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const filename = `Passwörter ${group.name}.xlsx`;
    saveAs(blob, filename);
}
