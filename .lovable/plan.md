
## Fix Token Lifecycle Panel - Hien Thi 0/0/0 Du Da Mint On-Chain

### Phan Tich Nguyen Nhan Goc

Cha da xac nhan tren BSCScan:
- Giao dich `lockWithPPLP` cho dia chi `0x6e0a...b68c` **THANH CONG** (Status: Success)
- Input data chua dung dia chi nguoi dung
- Contract `0x1aa8DE8B...` dang giu 99,482 FUN (token bi khoa cho tat ca nguoi dung)
- ABI cua `alloc(address)` khop chinh xac voi contract da verify tren BSCScan

**Van de**: Token Lifecycle Panel hien 0/0/0 vi `fetchContractInfo()` **that bai tham lang** (silent failure). Cu the:

```text
TokenLifecyclePanel
  |
  +-> useFUNMoneyContract -> contract = null (khong khoi tao duoc)
  |     |
  |     +-> getContractAddress() -> FUN_MONEY_ADDRESSES[chainId]
  |           |
  |           +-> Neu chainId = 56 (Mainnet) -> return "" -> null
  |           +-> Neu chainId = undefined -> return null
  |           +-> Neu MetaMask bi khoa/khong phan hoi -> null
  |
  +-> contractInfo = null
  |
  +-> locked = parseFloat(null?.locked || "0") = 0
  +-> activated = parseFloat(null?.activated || "0") = 0
  +-> balance = parseFloat(null?.balance || "0") = 0
  |
  +-> Hien thi 0/0/0 KHONG CO LOI (vi contractDiagnostics cung null)
```

Khi `contract` la null, `fetchContractInfo` return ngay ma khong set bat ky thong bao loi nao. Panel hien 0/0/0 nhu the khong co token nao, gay nham lan cho nguoi dung.

### Ke Hoach Sua - 3 Thay Doi

#### 1. Them trang thai "Khong doc duoc on-chain" voi huong dan chuyen mang

Trong `TokenLifecyclePanel.tsx`, them kiem tra: khi ket noi vi nhung `contractInfo` la null (khong doc duoc contract), hien thi thong bao ro rang thay vi 0/0/0.

Thong bao se bao gom:
- Canh bao "Khong the doc du lieu on-chain"
- Huong dan "Vui long chuyen sang BSC Testnet trong MetaMask"
- Nut "Chuyen sang BSC Testnet" su dung `switchToBSC()` tu wallet context
- Hien thi so lieu tu DB (du lieu da mint) de nguoi dung biet token cua ho van an toan

#### 2. Them du lieu DB fallback vao TokenLifecyclePanel

Khi on-chain read that bai, dung `useFUNMoneyStats` de hien thi so lieu tu database:
- "Da mint on-chain: X FUN" (tu pplp_actions voi status = minted)
- "San sang claim: Y FUN" (tu pplp_actions voi status = scored, decision = pass)

Dieu nay dam bao nguoi dung luon thay duoc trang thai token cua ho, ke ca khi vi chua ket noi dung mang.

#### 3. Them log chan doan vao useFUNMoneyContract

Them console.log tai cac diem quan trong:
- Khi `getContractAddress()` tra ve null (log chainId hien tai)
- Khi contract init bi bo qua vi thieu dia chi
- Khi `fetchContractInfo()` bi bo qua vi contract null

### Chi Tiet Ky Thuat

**File 1: `src/components/mint/TokenLifecyclePanel.tsx`**

Thay doi chinh:
- Import `useFUNMoneyStats` va `useAuth` de lay du lieu DB
- Them trang thai moi giua "Connected" va "Network Error": trang thai "Contract Not Available"
- Khi `isConnected && !contractInfo && !hasNetworkIssue && !hasContractIssue`:
  - Hien banner huong dan chuyen mang BSC Testnet
  - Hien so lieu tu DB (totalMinted, totalScored)
  - An 3 o Locked/Activated/Flowing (vi du lieu khong chinh xac)
- Them nut "Chuyen sang BSC Testnet" goi `switchToBSC()` tu Web3WalletContext

**File 2: `src/hooks/useFUNMoneyContract.ts`**

Them console.log:
- Line ~97: Log khi `getContractAddress()` tra ve null kem `chainId`
- Line ~150: Log khi contract init bi bo qua
- Line ~190: Log khi `fetchContractInfo` bi bo qua vi contract null

**File 3: `src/contexts/Web3WalletContext.tsx`**

Khong can sua - `switchToBSC` da duoc export san.

### Ket Qua Mong Doi

- Nguoi dung se thay THONG BAO RO RANG thay vi 0/0/0 khi vi o sai mang
- Nguoi dung co the nhan nut de chuyen sang BSC Testnet ngay trong giao dien
- So lieu tu DB se hien thi de nguoi dung biet token cua ho van an toan
- Sau khi chuyen mang, panel tu dong tai lai va hien thi dung Locked/Activated/Flowing

### Files Can Sua

| # | File | Mo ta |
|---|---|---|
| 1 | `src/components/mint/TokenLifecyclePanel.tsx` | Them trang thai fallback khi contract null, nut switch network, hien DB stats |
| 2 | `src/hooks/useFUNMoneyContract.ts` | Them diagnostic logging |
