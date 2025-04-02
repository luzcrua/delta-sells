
import React, { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader, Check, AlertCircle, ExternalLink } from "lucide-react";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormCombobox from "@/components/FormCombobox";
import FormTextarea from "@/components/FormTextarea";
import FormDatePicker from "@/components/FormDatePicker";
import { formatCPF, formatPhone, formatCurrency } from "@/lib/formatters";
import { formSchema, type FormValues } from "@/lib/validators";
import { 
  submitToGoogleSheets, 
  isWebhookConfigured, 
  sendToWhatsAppFallback, 
  getGoogleSheetViewUrl 
} from "@/services/GoogleSheetsService";
import { LogService } from "@/services/LogService";
import { format, addDays } from "date-fns";

const CustomerForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [valorNumerico, setValorNumerico] = useState(0);
  const [freteNumerico, setFreteNumerico] = useState(15);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSheetLink, setShowSheetLink] = useState(false);
  const [valorParcela, setValorParcela] = useState("");
  const [datasPagamento, setDatasPagamento] = useState<string[]>([]);
  
  useEffect(() => {
    const configured = isWebhookConfigured();
    setIsConfigured(configured);
    LogService.info(`CustomerForm - Webhook configurado: ${configured}`);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      telefone: "",
      genero: "Masculino",
      linha: "",
      tipo: "",
      cor: "",
      tamanho: "",
      valor: "",
      formaPagamento: "PIX",
      parcelamento: "Sem parcelamento",
      cupomDesconto: "Sem desconto",
      nomeCupom: "",
      localizacao: "",
      frete: "15,00",
      dataPagamento: undefined,
      dataEntrega: undefined,
      valorTotal: "R$ 15,00",
      observacao: "",
    },
  });

  const formaPagamento = watch("formaPagamento");
  const cupomDesconto = watch("cupomDesconto");
  const nomeCupom = watch("nomeCupom");
  const valor = watch("valor");
  const frete = watch("frete");
  const parcelamento = watch("parcelamento");
  const dataPagamento = watch("dataPagamento");
  
  // Calcula o valor total considerando descontos e frete
  useEffect(() => {
    try {
      // Limpa e converte o valor e frete para números
      const cleanValor = valor.replace(/[^\d,]/g, "").replace(",", ".");
      const cleanFrete = frete.replace(/[^\d,]/g, "").replace(",", ".");
      
      // Parseia os valores para números
      const parsedValor = cleanValor ? parseFloat(cleanValor) : 0;
      const parsedFrete = cleanFrete ? parseFloat(cleanFrete) : 0;
      
      setValorNumerico(parsedValor);
      setFreteNumerico(parsedFrete);
      
      // Calcula o desconto baseado no cupom selecionado
      let descontoPercentual = 0;
      
      if (cupomDesconto === "5% OFF") {
        descontoPercentual = 5;
      } else if (cupomDesconto === "10% OFF") {
        descontoPercentual = 10;
      } else if (cupomDesconto === "15% OFF") {
        descontoPercentual = 15;
      }
      
      // Calcula o valor com desconto
      const desconto = (parsedValor * descontoPercentual) / 100;
      const valorComDesconto = parsedValor - desconto;
      
      // Adiciona o frete ao valor com desconto
      const valorComDescontoEFrete = valorComDesconto + parsedFrete;
      
      // Valor final (sem juros pois todos são sem juros)
      let valorFinal = valorComDescontoEFrete;
      let valorParcelaCalculado = valorFinal;
      let numParcelas = 1;
      let datasParcelas: string[] = [];
      
      // Calcula parcelamento (todos sem juros)
      if (parcelamento && parcelamento !== "Sem parcelamento") {
        numParcelas = parseInt(parcelamento.split("x")[0]);
        
        // Calcula o valor da parcela
        valorParcelaCalculado = valorFinal / numParcelas;
        
        // Formata o valor da parcela
        setValorParcela(formatCurrency(String(Math.round(valorParcelaCalculado * 100))));
        
        // Gera as datas de pagamento das parcelas
        if (dataPagamento) {
          const novasDatasParcelas = [];
          for (let i = 0; i < numParcelas; i++) {
            const dataParcela = addDays(dataPagamento, i * 30); // 30 dias entre cada parcela
            novasDatasParcelas.push(format(dataParcela, "dd/MM/yy"));
          }
          setDatasPagamento(novasDatasParcelas);
        } else {
          setDatasPagamento([]);
        }
      } else {
        setValorParcela("");
        setDatasPagamento([]);
      }
      
      // Arredonda para duas casas decimais
      const totalArredondado = Math.round(valorFinal * 100) / 100;
      const totalEmCentavos = Math.round(totalArredondado * 100);
      
      // Atualiza o valor total no formulário
      setValue("valorTotal", formatCurrency(String(totalEmCentavos)));
      
      LogService.debug("Valores atualizados", { 
        parsedValor, 
        parsedFrete, 
        descontoPercentual, 
        desconto,
        valorComDesconto,
        valorComDescontoEFrete,
        formaPagamento,
        parcelamento,
        numParcelas,
        valorParcelaCalculado,
        valorFinal,
        totalArredondado,
        totalEmCentavos,
        datasParcelas
      });
    } catch (error) {
      LogService.error("Erro ao calcular valor total", error);
      setValue("valorTotal", formatCurrency(String(parseFloat(frete.replace(/[^\d,]/g, "").replace(",", ".")) * 100 || 1500)));
    }
  }, [valor, frete, cupomDesconto, formaPagamento, parcelamento, dataPagamento, setValue]);

  const handleInputChange = (field: keyof FormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setValue(field, e.target.value);
  };

  const handleSelectChange = (field: keyof FormValues) => (value: string) => {
    setValue(field, value);
  };

  const handleTextareaChange = (field: keyof FormValues) => (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(field, e.target.value);
  };

  const handleDateChange = (field: keyof FormValues) => (date: Date | undefined) => {
    setValue(field, date);
  };

  const handleSendToWhatsApp = (data: FormValues) => {
    LogService.info("Redirecionando para envio via WhatsApp", { formType: "cliente" });
    sendToWhatsAppFallback({
      ...data,
      dataPagamento: data.dataPagamento ? format(data.dataPagamento, "dd/MM/yy") : "",
      dataEntrega: data.dataEntrega ? format(data.dataEntrega, "dd/MM/yy") : "",
      formType: 'cliente',
    });
  };

  const openGoogleSheet = () => {
    LogService.info("Abrindo Google Sheet para visualização");
    window.open(getGoogleSheetViewUrl('cliente'), '_blank');
  };

  const onSubmit = async (data: FormValues) => {
    LogService.info("Formulário de Cliente - Submissão iniciada", { nome: data.nome, telefone: data.telefone });
    setIsSubmitting(true);
    setSubmitError(null);
    setShowSheetLink(false);
    
    try {
      const formattedData = {
        ...data,
        cupom: data.cupomDesconto,
        dataPagamento: data.dataPagamento ? format(data.dataPagamento, "dd/MM/yy") : "",
        dataEntrega: data.dataEntrega ? format(data.dataEntrega, "dd/MM/yy") : "",
        valorParcela: valorParcela,
        datasPagamento: datasPagamento.join(", "),
        formType: 'cliente',
      };
      
      LogService.debug("Formulário de Cliente - Dados formatados para envio", formattedData);
      
      let attempt = 1;
      let result;
      
      while (attempt <= 3) {
        LogService.info(`Formulário de Cliente - Tentativa ${attempt}/3 de envio`);
        
        try {
          result = await submitToGoogleSheets(formattedData);
          LogService.info(`Formulário de Cliente - Resposta da tentativa ${attempt}`, result);
          
          if (result.success) {
            break;
          } else {
            if (!result.message.includes("network") && !result.message.includes("CORS")) {
              break;
            }
          }
        } catch (innerError) {
          LogService.error(`Formulário de Cliente - Erro na tentativa ${attempt}`, innerError);
        }
        
        attempt++;
        if (attempt <= 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (result?.success) {
        LogService.info("Formulário de Cliente - Envio bem-sucedido");
        toast({
          title: "Sucesso!",
          description: "Dados enviados com sucesso para a planilha.",
        });
        setSubmitted(true);
        setShowSheetLink(true);
        
        setTimeout(() => {
          reset();
          setSubmitted(false);
        }, 3000);
      } else {
        const errorMsg = result?.message || "Erro desconhecido ao enviar dados.";
        LogService.warn("Formulário de Cliente - Falha no envio", { errorMsg });
        setSubmitError(errorMsg);
        toast({
          title: "Aviso",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      LogService.error("Formulário de Cliente - Erro crítico na submissão", error);
      
      const errorMsg = error instanceof Error ? error.message : "Ocorreu um erro ao enviar os dados. Tente novamente.";
      setSubmitError(errorMsg);
      
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        {!isConfigured && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md">
            <p className="text-sm">
              ⚠️ A URL do App Script não está configurada no arquivo env.ts. Configure o arquivo para habilitar o envio direto para o Google Sheets.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="form-section space-y-4">
            <h2 className="text-2xl font-semibold text-delta-800 mb-4">
              Informações Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="nome"
                label="Nome"
                value={watch("nome")}
                onChange={handleInputChange("nome")}
                placeholder="Digite o nome completo"
                error={errors.nome?.message}
                required
              />
              <FormInput
                id="cpf"
                label="CPF"
                value={watch("cpf") || ""}
                onChange={handleInputChange("cpf")}
                placeholder="000.000.000-00"
                error={errors.cpf?.message}
                formatter={formatCPF}
                maxLength={14}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="telefone"
                label="Telefone"
                value={watch("telefone")}
                onChange={handleInputChange("telefone")}
                placeholder="(00) 00000-0000"
                error={errors.telefone?.message}
                formatter={formatPhone}
                required
                maxLength={15}
              />
              <FormSelect
                id="genero"
                label="Gênero"
                value={watch("genero")}
                onChange={handleSelectChange("genero")}
                options={[
                  { value: "Masculino", label: "Masculino" },
                  { value: "Feminino", label: "Feminino" },
                  { value: "Outro", label: "Outro" },
                ]}
                error={errors.genero?.message}
                required
              />
            </div>
          </div>

          <Separator />

          <div className="form-section space-y-4">
            <h2 className="text-2xl font-semibold text-delta-800 mb-2">
              Informações do Produto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormCombobox
                id="linha"
                label="Linha"
                value={watch("linha")}
                onChange={handleSelectChange("linha")}
                onCustomInputChange={handleInputChange("linha")}
                options={[
                  { value: "Oversized", label: "Oversized" },
                  { value: "Run Muscle", label: "Run Muscle" },
                  { value: "Delta Basic", label: "Delta Basic" },
                  { value: "Feminine", label: "Feminine" },
                ]}
                error={errors.linha?.message}
                required
              />
              <FormCombobox
                id="tipo"
                label="Tipo"
                value={watch("tipo")}
                onChange={handleSelectChange("tipo")}
                onCustomInputChange={handleInputChange("tipo")}
                options={[
                  { value: "Camisa Normal", label: "Camisa Normal" },
                  { value: "Camisa de Compressão", label: "Camisa de Compressão" },
                  { value: "Short", label: "Short" },
                  { value: "Legging", label: "Legging" },
                  { value: "Regata", label: "Regata" },
                  { value: "Top", label: "Top" },
                  { value: "Blusa Normal", label: "Blusa Normal" },
                  { value: "Blusa de Compressão", label: "Regata" },
                ]}
                error={errors.tipo?.message}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormCombobox
                id="cor"
                label="Cor"
                value={watch("cor")}
                onChange={handleSelectChange("cor")}
                onCustomInputChange={handleInputChange("cor")}
                options={[
                  { value: "OFF WHITE", label: "OFF WHITE" },
                  { value: "PRETO(A)", label: "PRETO(A)" },
                  { value: "BRANCO(A)", label: "BRANCO(A)" },
                  { value: "AZUL", label: "AZUL" },
                  { value: "AZUL MARINHO", label: "AZUL MARINHO" },
                  { value: "CINZA", label: "CINZA" },
                ]}
                error={errors.cor?.message}
                required
              />
              <FormCombobox
                id="tamanho"
                label="Tamanho"
                value={watch("tamanho")}
                onChange={handleSelectChange("tamanho")}
                onCustomInputChange={handleInputChange("tamanho")}
                options={[
                  { value: "XPP", label: "XPP" },
                  { value: "PP", label: "PP" },
                  { value: "P", label: "P" },
                  { value: "M", label: "M" },
                  { value: "G", label: "G" },
                  { value: "GG", label: "GG" },
                ]}
                error={errors.tamanho?.message}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <FormInput
                id="valor"
                label="Valor"
                value={watch("valor")}
                onChange={handleInputChange("valor")}
                placeholder="R$ 0,00"
                error={errors.valor?.message}
               // formatter={formatCurrency}
                required
              />
            </div>
          </div>

          <Separator />

          <div className="form-section space-y-4">
            <h2 className="text-2xl font-semibold text-delta-800 mb-4">
              Pagamento e Entrega
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                id="formaPagamento"
                label="Forma de Pagamento"
                value={watch("formaPagamento")}
                onChange={handleSelectChange("formaPagamento")}
                options={[
                  { value: "PIX", label: "PIX" },
                  { value: "Débito", label: "Débito" },
                  { value: "Crédito", label: "Crédito" },
                  { value: "Dinheiro", label: "Dinheiro" },
                ]}
                error={errors.formaPagamento?.message}
                required
              />
              
              <FormSelect
                id="parcelamento"
                label="Parcelamento"
                value={watch("parcelamento") || "Sem parcelamento"}
                onChange={handleSelectChange("parcelamento")}
                options={[
                  { value: "Sem parcelamento", label: "Sem parcelamento" },
                  { value: "2x sem juros", label: "2x sem juros" },
                  { value: "3x sem juros", label: "3x sem juros" },
                  { value: "4x sem juros", label: "4x sem juros" },
                  { value: "5x sem juros", label: "5x sem juros" },
                  { value: "6x sem juros", label: "6x sem juros" },
                ]}
                error={errors.parcelamento?.message}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <FormInput
                id="localizacao"
                label="Localização"
                value={watch("localizacao") || ""}
                onChange={handleInputChange("localizacao")}
                placeholder="Digite a localização de entrega"
                error={errors.localizacao?.message}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormSelect
                  id="cupomDesconto"
                  label="Desconto Aplicado"
                  value={watch("cupomDesconto") || "Sem desconto"}
                  onChange={handleSelectChange("cupomDesconto")}
                  options={[
                    { value: "Sem desconto", label: "Sem desconto" },
                    { value: "5% OFF", label: "5% de desconto" },
                    { value: "10% OFF", label: "10% de desconto" },
                    { value: "15% OFF", label: "15% de desconto" },
                  ]}
                  error={errors.cupomDesconto?.message}
                />
              </div>
              
              <FormInput
                id="nomeCupom"
                label="Nome do Cupom (opcional)"
                value={watch("nomeCupom") || ""}
                onChange={handleInputChange("nomeCupom")}
                placeholder="Ex: BLACK FRIDAY"
                error={errors.nomeCupom?.message}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <FormCombobox
                id="frete"
                label="Frete"
                value={watch("frete")}
                onChange={handleSelectChange("frete")}
                onCustomInputChange={handleInputChange("frete")}
                options={[
                  { value: "15,00", label: "R$ 15,00" },
                  { value: "0,00", label: "Grátis" },
                ]}
                error={errors.frete?.message}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker
                id="dataPagamento"
                label="Data de Pagamento"
                value={watch("dataPagamento")}
                onChange={handleDateChange("dataPagamento")}
                error={errors.dataPagamento?.message}
                required
                placeholder="Selecione a data de pagamento"
              />
              <FormDatePicker
                id="dataEntrega"
                label="Data de Entrega"
                value={watch("dataEntrega")}
                onChange={handleDateChange("dataEntrega")}
                error={errors.dataEntrega?.message}
                required
                placeholder="Selecione a data de entrega"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <FormInput
                id="valorTotal"
                label="Valor Total"
                value={watch("valorTotal")}
                onChange={handleInputChange("valorTotal")}
                placeholder="R$ 0,00"
                error={errors.valorTotal?.message}
                className="font-semibold text-lg"
                required
                readOnly={true}
              />
              
              {parcelamento && parcelamento !== "Sem parcelamento" && valorParcela && (
                <div className="bg-delta-50 p-3 rounded-md border border-delta-100">
                  <p className="font-medium text-delta-800">Detalhes do parcelamento:</p>
                  <p className="text-delta-700">
                    {`${parcelamento} de ${valorParcela}`}
                  </p>
                  
                  {datasPagamento.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-delta-800">Datas de pagamento:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                        {datasPagamento.map((data, index) => (
                          <div key={index} className="bg-white p-1 rounded border border-delta-100 text-center text-sm">
                            <span className="font-medium">{index + 1}ª</span>: {data}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {cupomDesconto && cupomDesconto !== "Sem desconto" && (
                <div className="text-sm text-delta-600">
                  {`Desconto aplicado: ${cupomDesconto}`}
                  {nomeCupom && ` (${nomeCupom})`}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="form-section">
            <FormTextarea
              id="observacao"
              label="Observação"
              value={watch("observacao") || ""}
              onChange={handleTextareaChange("observacao")}
              placeholder="Digite informações adicionais, se necessário"
              error={errors.observacao?.message}
              rows={4}
            />
          </div>
          
          {showSheetLink && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-start">
              <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Dados enviados com sucesso!</p>
                <p className="text-sm">Os dados foram registrados na planilha.</p>
                <button 
                  type="button"
                  onClick={openGoogleSheet}
                  className="text-sm mt-2 flex items-center text-green-700 hover:text-green-900 font-medium"
                >
                  Ver na planilha <ExternalLink className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro no envio</p>
                <p className="text-sm">{submitError}</p>
                <p className="text-sm mt-1">Seus dados não foram perdidos.</p>
                <button 
                  type="button"
                  onClick={() => handleSendToWhatsApp(watch())}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center"
                >
                  Enviar via WhatsApp <ExternalLink className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          <div className="form-section flex justify-center pt-4">
            <Button
              type="submit"
              className="w-full md:w-1/2 h-12 bg-delta-600 hover:bg-delta-700 text-white font-semibold text-lg transition-colors"
              disabled={isSubmitting || submitted}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  Enviando...
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Enviado com Sucesso!
                </span>
              ) : (
                "Enviar Dados"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
