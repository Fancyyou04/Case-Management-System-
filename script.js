document.addEventListener("DOMContentLoaded", function () {
  const caseForm = document.getElementById("caseForm");
  const investigatorSelect = document.getElementById("investigator");
  const oldInvestigatorSelect = document.getElementById("oldInvestigatorSelect");
  const newInvestigatorInput = document.getElementById("newInvestigator");
  const newOldInvestigatorInput = document.getElementById("newOldInvestigator");
  const caseTable = document.getElementById("caseTable");
  const searchInput = document.getElementById("searchInput");
  const notFoundMsg = document.getElementById("notFoundMsg");

  let caseList = JSON.parse(localStorage.getItem("caseList")) || [];
  let investigators = JSON.parse(localStorage.getItem("investigators")) || [];

  function loadInvestigators() {
    const options = investigators.map(name => `<option value="${name}">${name}</option>`).join('');
    investigatorSelect.innerHTML = `<option value="">-- กรุณาเลือก --</option>` + options;
    oldInvestigatorSelect.innerHTML = `<option value="">-- กรุณาเลือก --</option>` + options;
  }

  loadInvestigators();

  [newInvestigatorInput, newOldInvestigatorInput].forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const newName = input.value.trim();
        if (newName && !investigators.includes(newName)) {
          investigators.push(newName);
          localStorage.setItem("investigators", JSON.stringify(investigators));
          loadInvestigators();
          input.value = "";
        }
      }
    });
  });

  caseForm?.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      receivedDate: document.getElementById("receivedDate").value,
      receivedTime: document.getElementById("receivedTime").value,
      caseCode: document.getElementById("caseCode").value,
      charge: document.getElementById("charge").value,
      victim: document.getElementById("victim").value,
      suspect: document.getElementById("suspect").value,
      investigator: investigatorSelect.value,
      oldInvestigator: oldInvestigatorSelect.value,
      handoverDate: document.getElementById("handoverDate").value,
      returnDate: document.getElementById("returnDate").value,
      returnTime: document.getElementById("returnTime").value
    };

    if (data.investigator && !investigators.includes(data.investigator)) {
    investigators.push(data.investigator);
  }
    if (data.oldInvestigator && !investigators.includes(data.oldInvestigator)) {
      investigators.push(data.oldInvestigator);
    }
    localStorage.setItem("investigators", JSON.stringify(investigators));
    loadInvestigators();
    
    const editingIndex = caseForm.getAttribute("data-editing");
    if (editingIndex !== null) {
      caseList[editingIndex] = data;
      caseForm.removeAttribute("data-editing");
    } else {
      caseList.push(data);
    }

    localStorage.setItem("caseList", JSON.stringify(caseList));
    caseForm.reset();
    renderTable(searchInput?.value.trim() || "");
  });

  window.editCase = function (index) {
    const c = caseList[index];
    document.getElementById("receivedDate").value = c.receivedDate;
    document.getElementById("receivedTime").value = c.receivedTime;
    document.getElementById("caseCode").value = c.caseCode;
    document.getElementById("charge").value = c.charge;
    document.getElementById("victim").value = c.victim;
    document.getElementById("suspect").value = c.suspect;
    document.getElementById("handoverDate").value = c.handoverDate || "";
    document.getElementById("returnDate").value = c.returnDate || "";
    document.getElementById("returnTime").value = c.returnTime || "";

    investigatorSelect.value = investigators.includes(c.investigator) ? c.investigator : "";
    newInvestigatorInput.value = !investigators.includes(c.investigator) ? c.investigator : "";

    oldInvestigatorSelect.value = investigators.includes(c.oldInvestigator) ? c.oldInvestigator : "";
    newOldInvestigatorInput.value = !investigators.includes(c.oldInvestigator) ? c.oldInvestigator : "";

    caseForm.setAttribute("data-editing", index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.deleteCase = function (index) {
    if (confirm("คุณแน่ใจว่าต้องการลบข้อมูลนี้?")) {
      caseList.splice(index, 1);
      localStorage.setItem("caseList", JSON.stringify(caseList));
      renderTable(searchInput?.value.trim() || "");
    }
  };

  function renderTable(filter = "") {
    caseTable.innerHTML = "";
    notFoundMsg?.style.setProperty("display", "none");

    const keywords = filter.toLowerCase().split(/\s+/);

    const filteredCases = caseList.filter(c => {
      const allText = `
        ${c.caseCode} ${c.receivedDate} ${c.receivedTime}
        ${c.returnDate} ${c.returnTime} ${c.suspect}
        ${c.victim} ${c.charge} ${c.investigator}
        ${c.oldInvestigator} ${c.handoverDate}
      `.toLowerCase();

      return keywords.every(word => allText.includes(word));
    });

    if (filteredCases.length === 0) {
      notFoundMsg?.style.setProperty("display", "block");
      return;
    }

    const last = filteredCases[filteredCases.length - 1];

    const today = new Date();
    const dueDate = new Date(last.returnDate);
    const diffDays = (dueDate - today) / (1000 * 60 * 60 * 24);

    let warningHTML = "";
    if (diffDays >= 0 && diffDays <= 3) {
      warningHTML = `<p style="color: red;"><strong>⚠️ เหลือ ${Math.ceil(diffDays)} วัน ก่อนถึงวันส่งสำนวน</strong></p>`;
    }

    const totalCasesByInvestigator = caseList.filter(c => c.investigator === last.investigator).length;

    const html = `
      <div class="case-card">
        <div class="card-actions">
          <a href="#" onclick="editCase(${caseList.indexOf(last)})">แก้ไข</a> |
          <a href="#" onclick="deleteCase(${caseList.indexOf(last)})" class="danger-link">ลบ</a>
        </div>
        <h3>รหัสคดี: ${last.caseCode}</h3>
        <p><strong>วันที่รับ:</strong> ${last.receivedDate} เวลา ${last.receivedTime}</p>
        <p><strong>ผู้ต้องหา:</strong> ${last.suspect}</p>
        <p><strong>ผู้เสียหาย:</strong> ${last.victim}</p>
        <p><strong>ฐานความผิด:</strong> ${last.charge}</p>
        <p><strong>พนักงานสอบสวนที่รับมอบสำนวน:</strong> ${last.investigator} 
          <em>(มีทั้งหมด ${totalCasesByInvestigator} คดี)</em></p>
        <p><strong>พนักงานสอบสวนคดีเดิม:</strong> ${last.oldInvestigator}</p>
        <p><strong>วันที่ส่งมอบสำนวนให้พนักงานสอบสวน:</strong> ${last.handoverDate || "-"}</p>
        <p><strong>วันที่ต้องส่งสำนวนให้อัยการ:</strong> ${last.returnDate || "-"} เวลา ${last.returnTime || "-"}</p>
        ${warningHTML}
      </div>
    `;
    caseTable.innerHTML = html;
  }

  searchInput?.addEventListener("input", () => {
    renderTable(searchInput.value.trim());
  });

  const editFromList = localStorage.getItem("editIndex");
  if (editFromList !== null) {
    editCase(Number(editFromList));
    localStorage.removeItem("editIndex");
  }

  renderTable();
});





