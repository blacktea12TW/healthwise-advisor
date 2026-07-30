import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Sparkles,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  TrendingUp,
  Heart,
  Activity,
  Stethoscope,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { askInsuranceLLM } from "@/lib/llm-client";

export const Route = createFileRoute("/")({
  component: Index,
});

type Gender = "male" | "female";
type DiseaseKey = "cancer" | "cardio" | "accident" | "surgery";

interface Policy {
  id: string;
  company: string;
  companyEn: string;
  category: string;
  medicalType: string;
  premium: number;
  policyName: string;
  description: string;
  payoutAmount: string;
  payoutRatio: string;
  payoutStandard: "guaranteed" | "conditional" | "consult";
  flagged?: { source: string; note: string };
}

const DISEASES: { value: DiseaseKey; label: string; icon: typeof Heart }[] = [
  { value: "cancer", label: "癌症 Cancer", icon: Activity },
  { value: "cardio", label: "心血管疾病 Cardiovascular", icon: Heart },
  { value: "accident", label: "意外 Accident", icon: AlertTriangle },
  { value: "surgery", label: "手術 Surgery", icon: Stethoscope },
];

const MOCK_POLICIES: Policy[] = [
  {
    id: "p1",
    company: "國泰人壽",
    companyEn: "Cathay Life",
    category: "醫療險",
    medicalType: "手術險 Surgery",
    premium: 12800,
    policyName: "康健守護實支實付終身醫療A型",
    description: "涵蓋住院日額、手術費用實支實付，含門診手術、雜費上限每次NT$180,000，保證續保至85歲。",
    payoutAmount: "NT$ 180,000 / 次",
    payoutRatio: "100%",
    payoutStandard: "guaranteed",
  },
  {
    id: "p2",
    company: "南山人壽",
    companyEn: "Nan Shan Life",
    category: "重大疾病",
    medicalType: "癌症險 Cancer",
    premium: 18500,
    policyName: "新一代抗癌鬥士終身癌症保險",
    description: "初次罹癌一次金NT$1,000,000，化療放療每次給付，含標靶藥物與癌症門診手術。",
    payoutAmount: "NT$ 1,000,000",
    payoutRatio: "100%",
    payoutStandard: "guaranteed",
    flagged: {
      source: "Dcard 保險版 2024/06 討論串",
      note: "多名用戶反映理賠審核期較長，部分標靶藥物需附加證明。",
    },
  },
  {
    id: "p3",
    company: "富邦人壽",
    companyEn: "Fubon Life",
    category: "意外險",
    medicalType: "意外險 Accident",
    premium: 4200,
    policyName: "全方位意外傷害保險 Plus",
    description: "意外身故最高NT$3,000,000，意外醫療實支實付上限NT$60,000，含交通事故加倍給付。",
    payoutAmount: "NT$ 60,000 / 次",
    payoutRatio: "90%",
    payoutStandard: "conditional",
  },
  {
    id: "p4",
    company: "新光人壽",
    companyEn: "Shin Kong Life",
    category: "醫療險",
    medicalType: "住院醫療 Hospitalization",
    premium: 9800,
    policyName: "安心醫定保住院日額醫療",
    description: "住院日額NT$3,000，加護病房加倍，含門診手術，保證續保至75歲。",
    payoutAmount: "NT$ 3,000 / 日",
    payoutRatio: "80%",
    payoutStandard: "conditional",
  },
  {
    id: "p5",
    company: "遠雄人壽",
    companyEn: "Yuanta Life",
    category: "重大疾病",
    medicalType: "心血管險 Cardio",
    premium: 15200,
    policyName: "護心心血管重大傷病保障",
    description: "涵蓋7項心血管重大傷病一次金NT$800,000，含心導管手術與支架植入。",
    payoutAmount: "NT$ 800,000",
    payoutRatio: "100%",
    payoutStandard: "guaranteed",
    flagged: {
      source: "PTT insurance 版 2023 熱門文",
      note: "早期版本條款對「心血管重大傷病」定義較嚴格，需諮詢最新版本。",
    },
  },
  {
    id: "p6",
    company: "中國人壽",
    companyEn: "China Life",
    category: "醫療險",
    medicalType: "實支實付 Reimbursement",
    premium: 11600,
    policyName: "雙實付優選醫療終身保險",
    description: "雜費、手術費、住院日額三擇一給付，每次事故上限NT$200,000，可副本理賠。",
    payoutAmount: "NT$ 200,000 / 次",
    payoutRatio: "100%",
    payoutStandard: "guaranteed",
  },
  {
    id: "p7",
    company: "三商美邦",
    companyEn: "Mercuries Life",
    category: "意外險",
    medicalType: "意外醫療 Accident Med",
    premium: 3600,
    policyName: "平安守護意外傷害醫療附約",
    description: "意外醫療實支實付NT$30,000/次，含骨折未住院日額給付。",
    payoutAmount: "NT$ 30,000 / 次",
    payoutRatio: "70%",
    payoutStandard: "consult",
  },
  {
    id: "p8",
    company: "全球人壽",
    companyEn: "Transglobe Life",
    category: "重大疾病",
    medicalType: "癌症險 Cancer",
    premium: 13400,
    policyName: "抗癌保庇一年期癌症醫療",
    description: "癌症住院日額NT$5,000，癌症手術給付，可依病程續保。",
    payoutAmount: "NT$ 5,000 / 日",
    payoutRatio: "85%",
    payoutStandard: "conditional",
  },
  {
    id: "p9",
    company: "台灣人壽",
    companyEn: "Taiwan Life",
    category: "醫療險",
    medicalType: "手術險 Surgery",
    premium: 10800,
    policyName: "手術金保障終身醫療險",
    description: "涵蓋2000+手術項目，門診手術亦給付，最高倍數20倍。",
    payoutAmount: "NT$ 150,000 / 次",
    payoutRatio: "95%",
    payoutStandard: "guaranteed",
  },
  {
    id: "p10",
    company: "宏泰人壽",
    companyEn: "Hontai Life",
    category: "醫療險",
    medicalType: "住院日額 Hospital",
    premium: 7200,
    policyName: "健康Plus住院日額醫療",
    description: "住院日額NT$2,000，含癌症住院加倍，可搭配實支實付使用。",
    payoutAmount: "NT$ 2,000 / 日",
    payoutRatio: "75%",
    payoutStandard: "consult",
    flagged: {
      source: "Mobile01 保險討論區",
      note: "部分用戶反映客服回應速度較慢，理賠文件要求較繁瑣。",
    },
  },
];

const PAYOUT_META: Record<
  Policy["payoutStandard"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  guaranteed: {
    label: "確定會賠",
    icon: CheckCircle2,
    className: "bg-success/15 text-success border-success/30",
  },
  conditional: {
    label: "可能會理賠",
    icon: HelpCircle,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  consult: {
    label: "需諮詢專員",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-border",
  },
};

function Index() {
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<string>("22");
  const [disease, setDisease] = useState<DiseaseKey>("cancer");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiReasoning, setAiReasoning] = useState<string[]>([]);
  const [displayPolicies, setDisplayPolicies] = useState<Policy[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setSubmitted(false);
    setSelected([]);
    setAiSummary("");
    setAiReasoning([]);
    setDisplayPolicies([]);

    try {
      const prompt = `你是保險推薦顧問。請根據以下使用者資料，輸出 JSON 格式的推薦結果。\n\n使用者資料：\n- 性別：${gender === "male" ? "男性" : "女性"}\n- 年齡：${age}\n- 疾病類別：${diseaseLabel}\n\n請輸出以下格式的 JSON（不要包含任何其他文字）：\n{\n  "summary": "80到120字的推薦摘要",\n  "reasoning": ["理由1", "理由2", "理由3"],\n  "policies": [\n    {\n      "id": "唯一識別碼如p1",\n      "company": "保險公司名稱",\n      "companyEn": "英文名稱",\n      "category": "保單類別如醫療險、重大疾病",\n      "medicalType": "醫療類型如手術險",\n      "premium": 數字保費,\n      "policyName": "保單名稱",\n      "description": "保單描述",\n      "payoutAmount": "理賠額度",\n      "payoutRatio": "理賠比例百分比",\n      "payoutStandard": "guaranteed或conditional或consult"\n    },\n    ... (共10個保單)\n  ]\n}\n\n重要：\n1. 生成10個符合${diseaseLabel}的保單推薦\n2. id須唯一且格式為p1-p10\n3. premium須為數字\n4. payoutStandard只能是guaranteed、conditional或consult其中之一\n5. 必須是有效的JSON格式`;

      const reply = await askInsuranceLLM(prompt);

      // Try to extract JSON from the response
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("無法解析 LLM 回應，請確保格式正確");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.summary || !Array.isArray(parsed.reasoning) || !Array.isArray(parsed.policies)) {
        throw new Error("LLM 輸出缺少必要欄位");
      }

      // Validate and filter policies
      const validPolicies: Policy[] = parsed.policies
        .filter((p: Policy) => {
          return (
            p.id &&
            p.company &&
            p.category &&
            p.medicalType &&
            typeof p.premium === "number" &&
            p.policyName &&
            p.description &&
            p.payoutAmount &&
            p.payoutRatio &&
            ["guaranteed", "conditional", "consult"].includes(p.payoutStandard)
          );
        })
        .slice(0, 10)
        .map((p: Policy, idx: number) => ({
          id: p.id || `p${idx + 1}`,
          company: p.company,
          companyEn: p.companyEn || p.company,
          category: p.category,
          medicalType: p.medicalType,
          premium: p.premium,
          policyName: p.policyName,
          description: p.description,
          payoutAmount: p.payoutAmount,
          payoutRatio: p.payoutRatio,
          payoutStandard: p.payoutStandard as "guaranteed" | "conditional" | "consult",
        }));

      if (validPolicies.length === 0) {
        throw new Error("LLM 生成的保單資料格式不符");
      }

      setAiSummary(parsed.summary);
      setAiReasoning(parsed.reasoning.slice(0, 3));
      setDisplayPolicies(validPolicies);

      setSubmitted(true);
      toast.success(`已為您生成 ${validPolicies.length} 張推薦保單`, {
        description: "AI 已根據你的條件提供個性化推薦",
      });
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "無法生成推薦";
      toast.error("推薦生成失敗", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      if (selected.length >= 3) {
        toast.warning("最多只能選擇 3 張保單進行比較", {
          description: "Maximum 3 policies can be compared",
        });
        return;
      }
      setSelected((s) => [...s, id]);
    } else {
      setSelected((s) => s.filter((x) => x !== id));
    }
  };

  const selectedPolicies = useMemo(
    () =>
      (displayPolicies.length > 0 ? displayPolicies : MOCK_POLICIES).filter((p) =>
        selected.includes(p.id),
      ),
    [selected, displayPolicies],
  );

  const matchScore = useMemo(() => {
    const a = parseInt(age || "0", 10);
    let base = 68;
    if (disease === "cancer") base += a < 30 ? 6 : a < 50 ? 14 : 20;
    if (disease === "cardio") base += a < 40 ? 4 : 18;
    if (disease === "accident") base += a < 30 ? 22 : 10;
    if (disease === "surgery") base += 12;
    if (gender === "female" && disease === "cancer") base += 4;
    return Math.min(97, base);
  }, [age, gender, disease]);

  const diseaseLabel = DISEASES.find((d) => d.value === disease)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl grid place-items-center bg-[image:var(--gradient-hero)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight text-foreground">InsureMatch AI</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">智慧保險推薦系統</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered · 透明推薦邏輯
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-[0.08]" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 md:pt-20 md:pb-16 relative">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <Badge className="bg-teal/15 text-teal border-teal/30 hover:bg-teal/20">
                Step 1 · 使用者輸入
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                找到<span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent"> 真正適合你 </span>的健康保險
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                告訴我們你的基本資料與想關注的疾病類別，AI 將依照理賠透明度、賠付比例與市場口碑，
                在數秒內產出 10 張精選保單建議，並支援動態比較。
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />透明理賠標準</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />雙實付智慧配對</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />社群風評提示</div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div
                className="rounded-2xl border border-border/70 p-6 md:p-8 shadow-[var(--shadow-elegant)]"
                style={{ background: "var(--gradient-card)" }}
              >
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">性別 Gender</Label>
                    <RadioGroup
                      value={gender}
                      onValueChange={(v) => setGender(v as Gender)}
                      className="grid grid-cols-2 gap-2"
                    >
                      {[
                        { v: "male", label: "男 Male" },
                        { v: "female", label: "女 Female" },
                      ].map((o) => (
                        <Label
                          key={o.v}
                          htmlFor={`g-${o.v}`}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                            gender === o.v
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <RadioGroupItem value={o.v} id={`g-${o.v}`} />
                          <span className="text-sm">{o.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium">年齡 Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min={0}
                      max={99}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">想問的疾病類別 Disease Category</Label>
                    <Select value={disease} onValueChange={(v) => setDisease(v as DiseaseKey)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISEASES.map((d) => {
                          const Icon = d.icon;
                          return (
                            <SelectItem key={d.value} value={d.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary" />
                                {d.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="lg"
                  className="mt-6 w-full h-12 text-base bg-[image:var(--gradient-hero)] hover:opacity-95 transition-opacity shadow-[var(--shadow-soft)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      AI 分析中… Generating
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      生成保單推薦 Generate Recommendations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      {submitted && (
        <section id="results" className="mx-auto max-w-7xl px-4 pb-16 animate-in fade-in duration-500">
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-2 mb-6">
              <TabsTrigger value="recommendations">
                <Shield className="h-4 w-4 mr-1.5" />
                推薦清單 Recommendations
              </TabsTrigger>
              <TabsTrigger value="dual">
                <Sparkles className="h-4 w-4 mr-1.5" />
                雙實付智慧推薦
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Badge className="bg-teal/15 text-teal border-teal/30 mb-2">Step 2 · 推薦結果</Badge>
                  <h2 className="text-2xl font-bold tracking-tight">10 張精選保單</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    根據 {gender === "male" ? "男性" : "女性"} · {age} 歲 · {diseaseLabel} 產生
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  已選擇 <span className="text-primary font-semibold">{selected.length}</span> / 3
                </div>
              </div>

              {aiSummary && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" /> AI 推薦摘要
                  </div>
                  <p className="text-sm leading-7 text-foreground">{aiSummary}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiReasoning.map((reason, idx) => (
                      <Badge key={`${reason}-${idx}`} variant="secondary" className="bg-background">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Accordion type="multiple" className="space-y-3">
                {(displayPolicies.length > 0 ? displayPolicies : MOCK_POLICIES).map((p, idx) => {
                  const meta = PAYOUT_META[p.payoutStandard];
                  const isSel = selected.includes(p.id);
                  return (
                    <AccordionItem
                      key={p.id}
                      value={p.id}
                      className={`rounded-xl border bg-card px-4 md:px-5 transition-all ${
                        isSel ? "border-primary ring-2 ring-primary/20 shadow-[var(--shadow-soft)]" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 py-1">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={(c) => toggleSelect(p.id, Boolean(c))}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5"
                          aria-label={`select ${p.policyName}`}
                        />
                        <AccordionTrigger className="flex-1 hover:no-underline py-4">
                          <div className="flex flex-1 items-center gap-4 text-left">
                            <div className="hidden sm:grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                              <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                {p.company}
                                {p.flagged && <span className="text-warning">⚠️</span>}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">{p.category}</div>
                              <div className="text-sm text-muted-foreground truncate">{p.medicalType}</div>
                              <div className="text-sm font-semibold text-primary">
                                NT$ {p.premium.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/年</span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pb-5 pt-0">
                        <div className="pl-0 sm:pl-14 space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                              保單名稱 Policy Name
                            </div>
                            <div className="font-semibold text-foreground">{p.policyName}</div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="outline" className={meta.className}>
                              <meta.icon className="h-3.5 w-3.5 mr-1" />
                              {meta.label}
                            </Badge>
                            <Badge variant="outline" className="border-border">
                              理賠 {p.payoutAmount} · {p.payoutRatio}
                            </Badge>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* Comparison Table */}
              {selectedPolicies.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-end justify-between gap-3 mb-4 mt-10 flex-wrap">
                    <div>
                      <Badge className="bg-teal/15 text-teal border-teal/30 mb-2">Step 3 · 比較矩陣</Badge>
                      <h2 className="text-2xl font-bold tracking-tight">保單比較表</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        目前比較 {selectedPolicies.length} 張保單 · 滑鼠移入 ⚠️ 查看社群來源
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[var(--shadow-soft)]">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[180px] font-semibold text-foreground">比較維度</TableHead>
                            {selectedPolicies.map((p) => (
                              <TableHead key={p.id} className="min-w-[220px] font-semibold text-foreground">
                                <div className="flex items-center gap-1.5">
                                  {p.company}
                                  {p.flagged && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className="cursor-pointer" aria-label="warning source">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-warning text-base">⚠️</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              點擊查看來源
                                            </TooltipContent>
                                          </Tooltip>
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-72" side="top">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                                            <AlertTriangle className="h-4 w-4" /> 社群風評提示
                                          </div>
                                          <div className="text-xs text-muted-foreground">來源 Source</div>
                                          <div className="text-sm font-medium">{p.flagged.source}</div>
                                          <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border">
                                            {p.flagged.note}
                                          </p>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                <div className="text-xs font-normal text-muted-foreground mt-0.5">
                                  {p.companyEn}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium align-top">
                              理賠標準
                              <div className="text-xs text-muted-foreground font-normal mt-0.5">Payout Standards</div>
                            </TableCell>
                            {selectedPolicies.map((p) => {
                              const meta = PAYOUT_META[p.payoutStandard];
                              return (
                                <TableCell key={p.id} className="align-top">
                                  <Badge variant="outline" className={meta.className}>
                                    <meta.icon className="h-3.5 w-3.5 mr-1" />
                                    {meta.label}
                                  </Badge>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium align-top">
                              類別與公司
                              <div className="text-xs text-muted-foreground font-normal mt-0.5">Category & Type</div>
                            </TableCell>
                            {selectedPolicies.map((p) => (
                              <TableCell key={p.id} className="align-top">
                                <div className="flex flex-col gap-1">
                                  <Badge variant="secondary" className="w-fit">{p.category}</Badge>
                                  <span className="text-sm text-muted-foreground">{p.medicalType}</span>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium align-top">
                              理賠金額
                              <div className="text-xs text-muted-foreground font-normal mt-0.5">Payout Amount</div>
                            </TableCell>
                            {selectedPolicies.map((p) => (
                              <TableCell key={p.id} className="align-top">
                                <div className="font-semibold text-foreground">{p.payoutAmount}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  賠償比例 {p.payoutRatio}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium align-top">
                              年繳保費
                              <div className="text-xs text-muted-foreground font-normal mt-0.5">Annual Premium</div>
                            </TableCell>
                            {selectedPolicies.map((p) => (
                              <TableCell key={p.id} className="align-top">
                                <div className="text-primary font-bold text-lg">
                                  NT$ {p.premium.toLocaleString()}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dual">
              <DualReimbursement
                score={matchScore}
                gender={gender}
                age={age}
                diseaseLabel={diseaseLabel}
              />
            </TabsContent>
          </Tabs>
        </section>
      )}

      <footer className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <div>© 2026 InsureMatch AI · Demo 使用模擬資料</div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> 為大學生 & 新鮮人設計</div>
        </div>
      </footer>
    </div>
  );
}

function DualReimbursement({
  score,
  gender,
  age,
  diseaseLabel,
}: {
  score: number;
  gender: Gender;
  age: string;
  diseaseLabel: string;
}) {
  const factors = [
    { label: "年齡風險加權", value: Math.min(95, 40 + parseInt(age || "0", 10)), icon: TrendingUp },
    { label: "疾病類別匹配", value: 88, icon: Activity },
    { label: "雙實付覆蓋率", value: 92, icon: Shield },
    { label: "社群風評指數", value: 81, icon: Users },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div
        className="lg:col-span-1 rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-[var(--shadow-elegant)]"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <Badge className="bg-white/20 border-white/30 text-primary-foreground hover:bg-white/25">
          BONUS · 雙實付智慧推薦
        </Badge>
        <div className="mt-5">
          <div className="text-sm opacity-80">你的契合度 Match Rate</div>
          <div className="text-6xl font-bold tracking-tight mt-1">{score}%</div>
          <div className="text-xs opacity-80 mt-1">
            {gender === "male" ? "男性" : "女性"} · {age} 歲 · {diseaseLabel}
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="text-sm font-medium">推薦保單組合</div>
          <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-3 text-sm">
            <div className="font-semibold">國泰康健守護 + 中國人壽雙實付</div>
            <div className="text-xs opacity-80 mt-1">正副本併行 · 雜費上限 NT$380,000</div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight">為什麼推薦這個組合？</h3>
              <p className="text-sm text-muted-foreground mt-1">
                解決「大學生被盲目推薦癌症險、不知推薦標準」的痛點
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="explanation">
                  <Info className="h-4 w-4 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="left">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">計算邏輯 Calculation</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    契合度 = 年齡風險加權 × 30% + 疾病類別匹配 × 30% + 雙實付覆蓋率 × 25% + 社群風評 × 15%。
                    所有分數皆基於公開理賠數據與社群討論指標。
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {factors.map((f) => (
              <div key={f.label} className="rounded-lg border border-border p-4 bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <f.icon className="h-4 w-4 text-primary" />
                  {f.label}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{f.value}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
                <Progress value={f.value} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            為什麼需要「雙實付」？
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              健保住院自付雜費、病房費升等常超過單張保單上限，需第二張補足缺口。
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              副本理賠可將醫療收據提交至兩家保險公司，降低自負比例。
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              系統會比對兩張保單條款重疊處，避免重複繳費。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
