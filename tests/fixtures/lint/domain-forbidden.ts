// Violación deliberada: el dominio solo puede importar `zod` y el propio dominio.
import { NextResponse } from "next/server";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as THREE from "three";
import { saveContact } from "@/adapters/supabase/contact";

export const all = [NextResponse, useState, createClient, THREE, saveContact];
