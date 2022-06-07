/* eslint-disable react/display-name */
import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TokenInfo } from "@solana/spl-token-registry";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardBody, TextInput, Box, Select, Text, Button } from "grommet";

import { TOKEN_LIST_URL, useJupiter } from "@jup-ag/react-hook";

//import FeeInfo from "./FeeInfo";
import fetch from "cross-fetch";
import { Refresh } from "grommet-icons";

interface IJupiterFormProps {}
type UseJupiterProps = Parameters<typeof useJupiter>[0];

const SECOND_TO_REFRESH = 30;

const JupiterForm: FunctionComponent<IJupiterFormProps> = () => {
  const wallet = useWallet();
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());
  const [exp, setExp] = useState(new RegExp("", "i"));

  const [formValue, setFormValue] = useState<UseJupiterProps>({
    amount: 4 * 10, // unit in lamports (Decimals)
    inputMint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    outputMint: new PublicKey("So11111111111111111111111111111111111111112"),
    slippage: 5, // 0.1%
  });

  const [inputTokenInfo, outputTokenInfo] = useMemo(() => {
    return [
      tokenMap.get(formValue.inputMint?.toBase58() || ""),
      tokenMap.get(formValue.outputMint?.toBase58() || ""),
    ];
  }, [formValue.inputMint?.toBase58(), formValue.outputMint?.toBase58()]);

  useEffect(() => {
    fetch(TOKEN_LIST_URL["mainnet-beta"])
      .then((res) => res.json())
      .then((tokens: TokenInfo[]) => {
        setTokenMap(
          tokens.reduce((map, item) => {
            map.set(item.address, item);
            return map;
          }, new Map())
        );
      });
  }, [setTokenMap]);

  const amountInDecimal = useMemo(() => {
    return formValue.amount * 10 ** (inputTokenInfo?.decimals || 1);
  }, [inputTokenInfo, formValue.amount]);

  const {
    routeMap,
    allTokenMints,
    routes,
    loading,
    exchange,
    //error,
    refresh,
    lastRefreshTimestamp,
  } = useJupiter({
    ...formValue,
    amount: amountInDecimal,
  });

  const validOutputMints = useMemo(
    () => routeMap.get(formValue.inputMint?.toBase58() || "") || allTokenMints,
    [routeMap, formValue.inputMint?.toBase58()]
  );

  // ensure outputMint can be swapable to inputMint
  useEffect(() => {
    if (formValue.inputMint) {
      const possibleOutputs = routeMap.get(formValue.inputMint.toBase58());

      if (
        possibleOutputs &&
        !possibleOutputs?.includes(formValue.outputMint?.toBase58() || "")
      ) {
        setFormValue((val) => ({
          ...val,
          outputMint: new PublicKey(possibleOutputs[0]),
        }));
      }
    }
  }, [formValue.inputMint?.toBase58(), formValue.outputMint?.toBase58()]);

  const [, setTimeDiff] = useState(lastRefreshTimestamp);
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (loading) return;

      const diff = (new Date().getTime() - lastRefreshTimestamp) / 1000;
      setTimeDiff((diff / SECOND_TO_REFRESH) * 100);

      if (diff >= SECOND_TO_REFRESH) {
        refresh();
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [loading]);

  const Option = React.memo(({ value }: { value: any }) => {
    const found = tokenMap.get(value);

    return (
      <Box key={value} direction="row" gap="10px" align="center" pad="20px">
        <img
          alt={found?.symbol}
          src={found?.logoURI}
          style={{ width: "30px", borderRadius: "2rem" }}
        />
        <Text>{found?.symbol}</Text>
      </Box>
    );
  });

  return (
    <Card height="normal" width="normal" background="dark-2">
      <CardBody pad="medium" gap="30px">
        <Box direction="column" gap="5px">
          <Box direction="row" justify="between" align="end">
            <Text>You pay</Text>
            <Button
              plain
              icon={<Refresh size="18px" />}
              onClick={refresh}
              disabled={loading}
            />
          </Box>
          <Box
            direction="row"
            gap="10px"
            background="dark-1"
            style={{
              borderRadius: "1rem",
              height: 56,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <Select
              id="inputMint"
              name="inputMint"
              options={allTokenMints.filter((o) => exp.test(o))}
              onClose={() => {
                setExp(new RegExp("", "i"));
              }}
              onSearch={(text) => {
                // The line below escapes regular expression special characters:
                // [ \ ^ $ . | ? * + ( )
                const escapedText = text.replace(
                  /[-\\^$*+?.()|[\]{}]/g,
                  "\\$&"
                );

                // Create the regular expression with modified value which
                // handles escaping special characters. Without escaping special
                // characters, errors will appear in the console
                const exp = new RegExp(escapedText, "i");
                setExp(exp);
              }}
              value={
                <Box
                  direction="row"
                  gap="10px"
                  align="center"
                  style={{ minWidth: 80 }}
                >
                  <img
                    src={
                      tokenMap.get(formValue?.inputMint?.toBase58()!)?.logoURI
                    }
                    style={{ width: "30px", borderRadius: "2rem" }}
                  />
                  <Text>
                    {tokenMap.get(formValue?.inputMint?.toBase58()!)?.symbol}
                  </Text>
                </Box>
              }
              plain
              onChange={(e) => {
                console.log("e", e);
                console.log("e.value.key", e.value);
                const pbKey = new PublicKey(e.value);
                if (pbKey) {
                  setFormValue((val) => ({
                    ...val,
                    inputMint: pbKey,
                  }));
                }
              }}
            >
              {(option) => <Option value={option} />}
            </Select>
            <TextInput
              name="amount"
              id="amount"
              placeholder="0"
              height="100%"
              plain="full"
              size="medium"
              textAlign="end"
              style={{ height: "100%" }}
              value={formValue.amount}
              onInput={(e: any) => {
                let newValue = Number(e.target?.value || 0);
                newValue = Number.isNaN(newValue) ? 0 : newValue;
                setFormValue((val) => ({
                  ...val,
                  amount: Math.max(newValue, 0),
                }));
              }}
            />
          </Box>
        </Box>
        <Box direction="column" gap="5px">
          <Text>You get</Text>
          <Box
            direction="row"
            gap="10px"
            background="dark-1"
            style={{
              borderRadius: "1rem",
              height: 56,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <Select
              id="outputMint"
              name="outputMint"
              options={validOutputMints.filter((o) => exp.test(o))}
              onClose={() => {
                setExp(new RegExp("", "i"));
              }}
              onSearch={(text) => {
                // The line below escapes regular expression special characters:
                // [ \ ^ $ . | ? * + ( )
                const escapedText = text.replace(
                  /[-\\^$*+?.()|[\]{}]/g,
                  "\\$&"
                );

                // Create the regular expression with modified value which
                // handles escaping special characters. Without escaping special
                // characters, errors will appear in the console
                const exp = new RegExp(escapedText, "i");
                setExp(exp);
              }}
              value={
                <Box
                  direction="row"
                  gap="10px"
                  align="center"
                  style={{ minWidth: 80 }}
                >
                  <img
                    src={
                      tokenMap.get(formValue?.outputMint?.toBase58()!)?.logoURI
                    }
                    style={{ width: "30px", borderRadius: "2rem" }}
                  />
                  <Text>
                    {tokenMap.get(formValue?.outputMint?.toBase58()!)?.symbol}
                  </Text>
                </Box>
              }
              plain
              onChange={(e) => {
                const pbKey = new PublicKey(e.value);
                if (pbKey) {
                  setFormValue((val) => ({
                    ...val,
                    outputMint: pbKey,
                  }));
                }
              }}
            >
              {(option) => <Option value={option} />}
            </Select>
            <TextInput
              name="outAmount"
              id="outAmount"
              placeholder="0"
              height="100%"
              plain="full"
              size="medium"
              textAlign="end"
              style={{ height: "100%" }}
              value={
                routes
                  ? routes[0].outAmount / 10 ** (outputTokenInfo?.decimals || 1)
                  : 0
              }
            />
          </Box>
          <Box direction="row" justify="center" style={{ marginTop: 20 }}>
            <Text>{routes?.length} routes found!</Text>
          </Box>

          <Text
            color="primary"
            style={{
              marginTop: 20,
            }}
          >
            Best route:
          </Text>
          {routes?.[0] &&
            (() => {
              const route = routes[0];
              return (
                <Box
                  direction="row"
                  style={{
                    marginBottom: 10,
                    borderRadius: "1rem",
                    backgroundImage:
                      "linear-gradient(96.8deg,#faa43a 4.71%,#71e5ed 87.84%)",
                  }}
                  background="dark-1"
                  gap="5px"
                  pad="10px"
                >
                  <Box direction="column">
                    <Text>
                      {route.marketInfos
                        .map((info) => info.amm.label)
                        .join(" -> ")}
                    </Text>
                    <Text>
                      {route.marketInfos
                        .map(
                          (info) =>
                            `${
                              tokenMap.get(info?.inputMint.toString())?.symbol
                            } -> ${
                              tokenMap.get(info?.outputMint.toString())?.symbol
                            }`
                        )
                        .join(" -> ")}
                    </Text>
                  </Box>
                </Box>
              );
            })()}
          <Button
            type="button"
            disabled={loading}
            label={"Swap best route"}
            style={{
              marginTop: 20,
            }}
            onClick={async () => {
              if (
                !loading &&
                routes?.[0] &&
                wallet.signAllTransactions &&
                wallet.signTransaction &&
                wallet.sendTransaction &&
                wallet.publicKey
              ) {
                const swapResult = await exchange({
                  wallet: {
                    sendTransaction: wallet.sendTransaction,
                    publicKey: wallet.publicKey,
                    signAllTransactions: wallet.signAllTransactions,
                    signTransaction: wallet.signTransaction,
                  },
                  routeInfo: routes[0],
                  onTransaction: async () => {
                    console.log("sending transaction");
                  },
                });

                console.log({ swapResult });

                if ("error" in swapResult) {
                  console.log("Error:", swapResult.error);
                } else if ("txid" in swapResult) {
                  console.log("Sucess:", swapResult.txid);
                  console.log("Input:", swapResult.inputAmount);
                  console.log("Output:", swapResult.outputAmount);
                }
              }
            }}
          />
        </Box>
      </CardBody>
    </Card>
  );
};

export default JupiterForm;
