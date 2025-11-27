"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Smartphone,
  Banknote,
  Shield,
  CheckCircle,
  ArrowLeft,
  Phone,
  Wallet,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

export default function PaymentsPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods = [
    {
      id: "orange",
      name: "Orange Money",
      icon: Smartphone,
      description: "Pay with Orange Money mobile wallet",
      fee: "No fees",
      availability: "Available nationwide",
      instructions: "Dial *144# to check balance",
    },
    {
      id: "africell",
      name: "Africell Money",
      icon: Phone,
      description: "Pay with Africell Money mobile wallet",
      fee: "No fees",
      availability: "Available nationwide",
      instructions: "Dial *133# to check balance",
    },
    {
      id: "qmoney",
      name: "QMoney",
      icon: Wallet,
      description: "Pay with QMoney mobile wallet",
      fee: "No fees",
      availability: "Available in major cities",
      instructions: "Dial *155# to check balance",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: CreditCard,
      description: "Direct bank transfer or mobile banking",
      fee: "Bank charges apply",
      availability: "All major banks",
      instructions: "Use mobile banking app or visit branch",
    },
    {
      id: "cash",
      name: "Cash Payment",
      icon: Banknote,
      description: "Pay cash at authorized agents",
      fee: "Small service fee",
      availability: "Agents in rural areas",
      instructions: "Find nearest agent location",
    },
  ]

  const consultationPackages = [
    {
      id: "basic",
      name: "Basic Consultation",
      price: "Le 5,000",
      description: "SMS-based consultation with healthcare provider",
      features: ["Text consultation", "Health advice", "Follow-up SMS"],
    },
    {
      id: "voice",
      name: "Voice Consultation",
      price: "Le 10,000",
      description: "Phone call consultation with healthcare provider",
      features: ["15-minute voice call", "Health assessment", "Treatment advice", "Follow-up call"],
    },
    {
      id: "video",
      name: "Video Consultation",
      price: "Le 15,000",
      description: "Video call consultation with healthcare provider",
      features: ["20-minute video call", "Visual examination", "Detailed consultation", "Digital prescription"],
    },
    {
      id: "premium",
      name: "Premium Package",
      price: "Le 25,000",
      description: "Comprehensive healthcare package",
      features: ["Multiple consultations", "Health monitoring", "24/7 support", "Emergency access"],
    },
  ]

  const handlePayment = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentStep(3)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">Payment Options</h1>
            <p className="text-gray-600">Affordable healthcare payments for everyone</p>
          </div>
        </div>

        {/* Payment Success */}
        {paymentStep === 3 && (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Your payment has been processed successfully. You can now access healthcare services.
            </p>

            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle>Payment Receipt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>Voice Consultation</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>Le 10,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span>{paymentMethods.find((m) => m.id === selectedMethod)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-sm">TXN123456789</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Status:</span>
                  <span className="text-green-600">Completed</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Link href="/consultation">
                <Button>Book Consultation</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Payment Processing */}
        {isProcessing && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we process your payment securely.</p>
          </div>
        )}

        {/* Step 1: Choose Package */}
        {paymentStep === 1 && !isProcessing && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Healthcare Package</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {consultationPackages.map((pkg) => (
                <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{pkg.price}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={() => setPaymentStep(2)}>
                      Select Package
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Affordability Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Affordable Healthcare for All</p>
                    <p className="text-sm text-blue-700">
                      We offer flexible payment options and subsidized rates for low-income families. Contact us for
                      assistance programs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Choose Payment Method */}
        {paymentStep === 2 && !isProcessing && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Payment Method</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedMethod === method.id ? "ring-2 ring-green-600 bg-green-50" : ""
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Icon className="h-8 w-8 text-green-600" />
                        <div>
                          <CardTitle className="text-lg">{method.name}</CardTitle>
                          <CardDescription>{method.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fee:</span>
                          <span className="font-medium">{method.fee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Availability:</span>
                          <span className="font-medium">{method.availability}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{method.instructions}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Payment Form */}
            {selectedMethod && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    Complete your payment using {paymentMethods.find((m) => m.id === selectedMethod)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMethod === "orange" || selectedMethod === "africell" || selectedMethod === "qmoney" ? (
                    <>
                      <div>
                        <Label htmlFor="phone">Mobile Number</Label>
                        <Input id="phone" placeholder="+232 XX XXX XXXX" />
                      </div>
                      <div>
                        <Label htmlFor="pin">Mobile Money PIN</Label>
                        <Input id="pin" type="password" placeholder="Enter your PIN" />
                      </div>
                    </>
                  ) : selectedMethod === "bank" ? (
                    <>
                      <div>
                        <Label htmlFor="account">Account Number</Label>
                        <Input id="account" placeholder="Enter account number" />
                      </div>
                      <div>
                        <Label htmlFor="bank">Bank Name</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Select your bank</option>
                          <option>Sierra Leone Commercial Bank</option>
                          <option>Guaranty Trust Bank</option>
                          <option>First International Bank</option>
                          <option>United Bank for Africa</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Banknote className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="font-medium mb-2">Cash Payment Instructions</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Visit any authorized HealthConnect agent to make your payment
                      </p>
                      <Button variant="outline" size="sm">
                        Find Nearest Agent
                      </Button>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>Voice Consultation</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>Le 10,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span>{paymentMethods.find((m) => m.id === selectedMethod)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span>{paymentMethods.find((m) => m.id === selectedMethod)?.fee}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">Le 10,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Card className="bg-green-50 border-green-200 mb-8">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Secure Payment</p>
                    <p className="text-sm text-green-700">
                      All payments are encrypted and secure. We never store your payment information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setPaymentStep(1)}>
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!selectedMethod}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        )}

        {/* Alternative Payment Methods */}
        {paymentStep === 1 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6 text-center">Alternative Access Methods</h3>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <Phone className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">USSD Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Pay directly from your phone using USSD codes</p>
                  <Badge variant="outline" className="mb-2">
                    *123*PAY#
                  </Badge>
                  <p className="text-xs text-gray-500">Works on any phone</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Clock className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Pay Later</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Access emergency consultations and pay within 7 days</p>
                  <Badge variant="outline" className="mb-2">
                    Emergency Access
                  </Badge>
                  <p className="text-xs text-gray-500">For urgent health needs</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Wallet className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Community Fund</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Apply for subsidized healthcare through community programs
                  </p>
                  <Badge variant="outline" className="mb-2">
                    Financial Aid
                  </Badge>
                  <p className="text-xs text-gray-500">Income-based assistance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
