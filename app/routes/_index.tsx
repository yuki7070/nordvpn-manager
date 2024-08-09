import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useActionData,
  Form,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { exec } from "child_process";
import { promisify } from "util";
import {
  Textarea,
  Button,
  useDisclosure,
  Select,
  SelectItem,
} from "@nextui-org/react";

const REGION_LIST = [
  "Albania",
  "Algeria",
  "Andorra",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bangladesh",
  "Belgium",
  "Belize",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bosnia_And_Herzegovina",
  "Brazil",
  "Brunei_Darussalam",
  "Bulgaria",
  "Cambodia",
  "Canada",
  "Cayman_Islands",
  "Chile",
  "Colombia",
  "Costa_Rica",
  "Croatia",
  "Cyprus",
  "Czech_Republic",
  "Denmark",
  "Dominican_Republic",
  "Ecuador",
  "Egypt",
  "El_Salvador",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Greenland",
  "Guam",
  "Guatemala",
  "Honduras",
  "Hong_Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Isle_Of_Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Kazakhstan",
  "Kenya",
  "Lao_Peoples_Democratic_Republic",
  "Latvia",
  "Lebanon",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Malta",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New_Zealand",
  "Nigeria",
  "North_Macedonia",
  "Norway",
  "Pakistan",
  "Panama",
  "Papua_New_Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Puerto_Rico",
  "Romania",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South_Africa",
  "South_Korea",
  "Spain",
  "Sri_Lanka",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Trinidad_And_Tobago",
  "Turkey",
  "Ukraine",
  "United_Arab_Emirates",
  "United_Kingdom",
  "United_States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
];

const execPromise = promisify(exec);
export const meta: MetaFunction = () => {
  return [
    { title: "NordVPN Manager" },
    { name: "description", content: "NordVPN Manager App" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const type = formData.get("type") as string;

  let command: string;
  switch (type) {
    case "login":
      command = `nordvpn login --token ${process.env.NORDVPN_TOKEN}`;
      break;
    case "disconnect":
      command = "nordvpn disconnect";
      break;
    case "connect":
      const region = formData.get("region") as string;
      command = `nordvpn connect ${region}`;
      break;
    default:
      return json({ error: "Invalid command" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      return json({ error: stderr });
    }

    return json({ output: stdout });
  } catch (error) {
    return json({ error: (error as Error).message });
  }
};

export const loader: LoaderFunction = async () => {
  try {
    const { stdout, stderr } = await execPromise("nordvpn status");

    if (stderr) {
      return json({ error: stderr });
    }

    return json({
      output: stdout
        .trim()
        .split("\n")
        .map((line) => line.split(":").map((part) => part.trim()))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
    });
  } catch (error) {
    return json({ error: (error as Error).message });
  }
};

export default function Index() {
  const { state } = useNavigation();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="font-sans p-2 flex flex-col h-svh">
      <div>
        <h1 className="text-3xl p-2">NordVPN Manager</h1>
        <h2 className="text-2xl p-2">Current Connection</h2>
        {loaderData.output && (
          <pre className="p-4">
            {Object.entries(loaderData.output).map(([key, value]) => (
              <div key={key}>
                <strong>{key}</strong>: {(value as string) || "N/A"}
              </div>
            ))}
          </pre>
        )}

        {loaderData.error && (
          <pre style={{ color: "red" }}>{loaderData.error}</pre>
        )}
      </div>
      <div>
        <h2 className="text-2xl p-2">Actions</h2>

        <Form method="post" className="p-2">
          <input
            className="border border-gray-400 p-2"
            name="type"
            placeholder="Enter a command"
            type="hidden"
            value="login"
          />
          <Button
            type="submit"
            color="primary"
            fullWidth
            isLoading={state === "submitting"}
          >
            Login
          </Button>
        </Form>

        <Form method="post" className="p-2">
          <input
            className="border border-gray-400 p-2"
            name="type"
            placeholder="Enter a command"
            type="hidden"
            value="disconnect"
          />
          <Button
            type="submit"
            color="warning"
            fullWidth
            isLoading={state === "submitting"}
          >
            Disconnect
          </Button>
        </Form>

        <Form method="post" className="p-2">
          <input
            className="border border-gray-400 p-2"
            name="type"
            placeholder="Enter a command"
            type="hidden"
            value="connect"
          />
          <Select
            name="region"
            label="Select Region"
            className="py-2"
            defaultSelectedKeys={["Japan"]}
          >
            {REGION_LIST.map((region) => (
              <SelectItem key={region}>{region}</SelectItem>
            ))}
          </Select>
          <Button
            type="submit"
            color="primary"
            fullWidth
            isLoading={state === "submitting"}
          >
            Connect
          </Button>
        </Form>
      </div>

      <div className="grow flex flex-col">
        <h2 className="text-2xl p-2">Output</h2>
        <Textarea
          className="p-2 grow "
          height={"100%"}
          value={actionData?.output || actionData?.error}
          color={actionData?.error ? "danger" : "default"}
          readOnly
        ></Textarea>
      </div>
    </div>
  );
}
