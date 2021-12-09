const dbApi = require("../api/dbApi");
exports.insertRemovalDates = async (inboxEventsWithAcls) => {
    let inboxIds = [];
    for (const inboxEventWithAcl of inboxEventsWithAcls) {
        inboxIds.push(inboxEventWithAcl.identifier);
    }
    await dbApi.insertRemovalDates(inboxIds);
};
