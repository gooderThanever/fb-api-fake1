import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const providers = [
  {
    name: "ffb", //Cái ffb này xịn nhất
    method: "GET" as const,
    url: (link: string) => `https://ffb.vn/api/tool/get-id-fb?idfb=${link}`,
    parseId: (data: any) => data.id,
    success: (data: any) => /^\d+$/.test(data.id),
    isEmpty: (data: any) =>
      data.msg === "Nhập sai đường dẫn link url hoặc chọn sai loại.",
  },
  {
    name: "traodoisub",
    method: "POST" as const,
    url: "https://id.traodoisub.com/api.php",
    buildBody: (link: string) => {
      const fd = new FormData();
      fd.append("link", link);
      return fd;
    },
    parseId: (data: any) => data.id,
    success: (data: any) => data.code === 200 && /^\d+$/.test(data.id),
    isEmpty: (data: any) =>
      data.msg === "Nhập sai đường dẫn link url hoặc chọn sai loại.",
  },
  {
    name: "phanmemninja",
    method: "POST" as const,
    url: "https://www.phanmemninja.com/wp-content/uid.php",
    buildBody: (link: string) => {
      const fd = new FormData();
      fd.append("link", link);
      return fd;
    },
    parseId: (data: any) => data.data,
    success: (data: any) => data.code === 200 && /^\d+$/.test(data.data),
    isEmpty: (data: any) =>
      data.msg === "Nhập sai đường dẫn link url hoặc chọn sai loại.",
  },
  {
    name: "proxyv6",
    method: "POST" as const,
    url: "https://proxyv6.net/wp-admin/admin-ajax.php",
    buildBody: (link: string) => {
      const fd = new FormData();
      fd.append("link", link);
      fd.append("action", "nlw_getuid_fb");
      return fd;
    },
    parseId: (data: any) => data.id,
    success: (data: any) => /^\d+$/.test(data.id),
    isEmpty: (data: any) =>
      data.msg === "Nhập sai đường dẫn link url hoặc chọn sai loại.",
  },
  {
    name: "duykhoa",
    method: "POST" as const,
    url: "https://duykhoa.com/assets/ajax/get_uid.php",
    buildBody: (link: string) => {
      const fd = new FormData();
      fd.append("link", link);
      return fd;
    },
    parseId: (data: any) => data.uid,
    success: (data: any) => data.code === 200 && /^\d+$/.test(data.uid),
    isEmpty: (data: any) =>
      data.msg === "Nhập sai đường dẫn link url hoặc chọn sai loại.",
  },
];

export async function POST(req: NextRequest) {
  const { linkFacebook, caseRun } = (await req.json()) as {
    linkFacebook: string;
    caseRun: number;
  };
  const sequence = [
    ...providers.slice(caseRun),
    ...providers.slice(0, caseRun),
  ];

  for (let i = 0; i < sequence.length; i++) {
    const { url, method, buildBody, parseId, success, isEmpty } = sequence[i];
    const endpoint = typeof url === "function" ? url(linkFacebook) : url;
    const init: RequestInit = {
      method,
      body: method === "POST" ? buildBody(linkFacebook) : undefined,
    };
    try {
      const res = await fetch(endpoint, init);
      if (!res.ok) continue;
      const data = await res.json();
      const id = parseId(data);
      if (success(data)) {
        return NextResponse.json({ status: true, id }, { status: 200 });
      } else if (isEmpty(data))
        return NextResponse.json({ status: true, id: "" }, { status: 200 });
    } catch {}
  }

  return NextResponse.json({ status: true, id: "" }, { status: 200 });
}
