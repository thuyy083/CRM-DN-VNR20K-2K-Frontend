import { useState } from "react";
import { importEnterprises } from "../../services/enterpriseService";
import { toast } from "react-toastify";
import "./ImportEnterpriseModal.scss"

function ImportEnterpriseModal({ close, reload }) {
  const [file, setFile] = useState(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file Excel");
      return;
    }

    try {
      await importEnterprises(file);
      toast.success("Import thành công");

      reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error("Import thất bại");
    }
  };

  return (
    <div className="modal">
      <div className="modal-box">
        <h3>Import doanh nghiệp</h3>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>

          <button className="save-btn" onClick={handleImport}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportEnterpriseModal;