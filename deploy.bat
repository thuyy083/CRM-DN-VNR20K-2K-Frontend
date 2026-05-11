@echo off
echo ===========================================
echo   AUTO DEPLOY FRONTEND CRM - VIETTEL.
echo ===========================================

echo   DOI BASE URL O FILE AXIOS CONFIG TRUOC KHI BUILD


echo [1/4] Dang tien hanh Build code...
call npm run build

echo [2/4] Dang don dep rac cu tren Server...
ssh root@171.254.92.12 "rm -rf /root/crm-deploy/frontend/*"

echo [3/4] Dang day code moi len Server...
scp -r .\dist\* root@171.254.92.12:/root/crm-deploy/frontend/

echo [4/4] Dang reset lai he thong Nginx...
ssh root@171.254.92.12 "cd /root/crm-deploy && docker compose restart frontend-web"

echo ===========================================
echo   DEPLOY THANH CONG! TAY RUA SACH SE!
echo   Bam Ctrl + F5 tren trinh duyet de xem.
echo ===========================================
pause